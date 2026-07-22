import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClockMethod, Prisma, Role, TimeEntryStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { ClockInDto, ClockOutDto } from './dto/clock.dto';
import { computeWorked } from './time.util';

const APPROVER_ROLES: Role[] = [Role.OWNER, Role.MANAGER, Role.TEAM_LEAD];

const entryInclude = {
  user: { select: { id: true, firstName: true, lastName: true, color: true } },
  shift: { select: { id: true, title: true } },
} satisfies Prisma.TimeEntryInclude;

@Injectable()
export class TimeTrackingService {
  constructor(private readonly prisma: PrismaService) {}

  private canApprove(role: string): boolean {
    return APPROVER_ROLES.includes(role as Role);
  }

  /** Huidige open (nog niet uitgeklokte) registratie van de gebruiker. */
  currentOpen(userId: string) {
    return this.prisma.timeEntry.findFirst({
      where: { userId, status: TimeEntryStatus.CLOCKED_IN },
      include: entryInclude,
      orderBy: { clockIn: 'desc' },
    });
  }

  async clockIn(user: AuthUser, dto: ClockInDto) {
    const open = await this.currentOpen(user.userId);
    if (open) {
      throw new BadRequestException('Je bent al ingeklokt');
    }
    return this.prisma.timeEntry.create({
      data: {
        userId: user.userId,
        shiftId: dto.shiftId,
        clockIn: new Date(),
        method: dto.method ?? ClockMethod.WEB,
        status: TimeEntryStatus.CLOCKED_IN,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
      include: entryInclude,
    });
  }

  async clockOut(user: AuthUser, dto: ClockOutDto) {
    const open = await this.currentOpen(user.userId);
    if (!open) {
      throw new BadRequestException('Je bent niet ingeklokt');
    }
    const clockOut = new Date();
    const breakMinutes = dto.breakMinutes ?? open.breakMinutes ?? 0;
    const breakdown = computeWorked(open.clockIn, clockOut, breakMinutes);

    return this.prisma.timeEntry.update({
      where: { id: open.id },
      data: {
        clockOut,
        breakMinutes,
        status: TimeEntryStatus.CLOCKED_OUT,
        ...breakdown,
      },
      include: entryInclude,
    });
  }

  /** Registraties: goedkeurders zien iedereen, werknemers enkel hun eigen. */
  findAll(user: AuthUser, from?: string, to?: string) {
    const where: Prisma.TimeEntryWhereInput = {};
    if (!this.canApprove(user.role)) {
      where.userId = user.userId;
    } else {
      where.user = { companyId: user.companyId };
    }
    if (from || to) {
      where.clockIn = {};
      if (from) (where.clockIn as Prisma.DateTimeFilter).gte = new Date(from);
      if (to) (where.clockIn as Prisma.DateTimeFilter).lte = new Date(to);
    }
    return this.prisma.timeEntry.findMany({
      where,
      include: entryInclude,
      orderBy: { clockIn: 'desc' },
      take: 200,
    });
  }

  /** Lijst medewerkers met hun huidige klokstatus (voor kioskmodus). */
  async kioskRoster(user: AuthUser) {
    if (!this.canApprove(user.role)) {
      throw new ForbiddenException('Alleen leidinggevenden mogen de kiosk gebruiken');
    }
    if (!user.companyId) throw new ForbiddenException('Geen bedrijf gekoppeld');
    const employees = await this.prisma.user.findMany({
      where: { companyId: user.companyId, isActive: true, role: Role.EMPLOYEE },
      select: { id: true, firstName: true, lastName: true, color: true },
      orderBy: { firstName: 'asc' },
    });
    const open = await this.prisma.timeEntry.findMany({
      where: {
        status: TimeEntryStatus.CLOCKED_IN,
        user: { companyId: user.companyId },
      },
      select: { userId: true, clockIn: true },
    });
    const openMap = new Map(open.map((o) => [o.userId, o.clockIn]));
    return employees.map((e) => ({
      ...e,
      clockedIn: openMap.has(e.id),
      since: openMap.get(e.id) ?? null,
    }));
  }

  /** Klokt een medewerker in of uit vanaf een gedeelde kiosk/tablet. */
  async kioskToggle(user: AuthUser, targetUserId: string) {
    if (!this.canApprove(user.role)) {
      throw new ForbiddenException('Alleen leidinggevenden mogen de kiosk gebruiken');
    }
    const target = await this.prisma.user.findFirst({
      where: { id: targetUserId, companyId: user.companyId ?? undefined },
    });
    if (!target) throw new NotFoundException('Medewerker niet gevonden');

    const open = await this.currentOpen(targetUserId);
    if (open) {
      const clockOut = new Date();
      const breakdown = computeWorked(open.clockIn, clockOut, open.breakMinutes ?? 0);
      await this.prisma.timeEntry.update({
        where: { id: open.id },
        data: { clockOut, status: TimeEntryStatus.CLOCKED_OUT, ...breakdown },
      });
      return { action: 'CLOCK_OUT', workedMinutes: breakdown.workedMinutes };
    }
    await this.prisma.timeEntry.create({
      data: {
        userId: targetUserId,
        clockIn: new Date(),
        method: ClockMethod.KIOSK,
        status: TimeEntryStatus.CLOCKED_IN,
      },
    });
    return { action: 'CLOCK_IN' };
  }

  async approve(user: AuthUser, id: string) {
    if (!this.canApprove(user.role)) {
      throw new ForbiddenException('Je mag geen uren goedkeuren');
    }
    const entry = await this.prisma.timeEntry.findFirst({
      where: { id, user: { companyId: user.companyId } },
    });
    if (!entry) throw new NotFoundException('Registratie niet gevonden');
    if (entry.status !== TimeEntryStatus.CLOCKED_OUT) {
      throw new BadRequestException('Alleen uitgeklokte registraties kunnen worden goedgekeurd');
    }
    return this.prisma.timeEntry.update({
      where: { id },
      data: { status: TimeEntryStatus.APPROVED },
      include: entryInclude,
    });
  }
}
