import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeaveStatus, LeaveType, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { CreateLeaveDto } from './dto/create-leave.dto';

// Rollen die verlof mogen goedkeuren.
const APPROVER_ROLES: Role[] = [Role.OWNER, Role.MANAGER, Role.TEAM_LEAD, Role.HR];

const leaveInclude = {
  employee: { select: { id: true, firstName: true, lastName: true, color: true } },
  decidedBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.LeaveRequestInclude;

/** Schat verlofuren: aantal werkdagen (ma-vr) in de periode × 8u. */
function estimateHours(start: Date, end: Date): number {
  let days = 0;
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (cur <= last) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) days++;
    cur.setDate(cur.getDate() + 1);
  }
  return days * 8;
}

@Injectable()
export class LeaveService {
  constructor(private readonly prisma: PrismaService) {}

  private assertCompany(companyId: string | null): asserts companyId is string {
    if (!companyId) throw new ForbiddenException('Geen bedrijf gekoppeld aan account');
  }

  private canApprove(role: string): boolean {
    return APPROVER_ROLES.includes(role as Role);
  }

  /** Lijst: goedkeurders zien alles binnen het bedrijf, werknemers enkel hun eigen. */
  findAll(user: AuthUser) {
    this.assertCompany(user.companyId);
    const where: Prisma.LeaveRequestWhereInput = { companyId: user.companyId };
    if (!this.canApprove(user.role)) {
      where.employeeId = user.userId;
    }
    return this.prisma.leaveRequest.findMany({
      where,
      include: leaveInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(user: AuthUser, dto: CreateLeaveDto) {
    this.assertCompany(user.companyId);
    const start = new Date(dto.startsAt);
    const end = new Date(dto.endsAt);
    if (end < start) {
      throw new BadRequestException('Einddatum ligt voor de startdatum');
    }
    const hours = estimateHours(start, end);
    return this.prisma.leaveRequest.create({
      data: {
        companyId: user.companyId,
        employeeId: user.userId,
        type: dto.type,
        startsAt: start,
        endsAt: end,
        hours,
        reason: dto.reason,
        status: LeaveStatus.PENDING,
      },
      include: leaveInclude,
    });
  }

  async decide(user: AuthUser, id: string, status: LeaveStatus) {
    this.assertCompany(user.companyId);
    if (!this.canApprove(user.role)) {
      throw new ForbiddenException('Je mag geen verlof goedkeuren');
    }
    const request = await this.prisma.leaveRequest.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!request) throw new NotFoundException('Verlofaanvraag niet gevonden');
    if (request.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Aanvraag is al beslist');
    }

    // Bij goedkeuring: saldo afboeken (indien saldo-type).
    if (status === LeaveStatus.APPROVED && request.hours) {
      await this.adjustBalance(
        request.employeeId,
        request.type,
        request.startsAt.getFullYear(),
        request.hours,
      );
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status, decidedById: user.userId, decidedAt: new Date() },
      include: leaveInclude,
    });
  }

  async cancel(user: AuthUser, id: string) {
    this.assertCompany(user.companyId);
    const request = await this.prisma.leaveRequest.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!request) throw new NotFoundException('Verlofaanvraag niet gevonden');
    // Alleen de eigenaar van de aanvraag of een goedkeurder mag annuleren.
    if (request.employeeId !== user.userId && !this.canApprove(user.role)) {
      throw new ForbiddenException('Geen rechten om dit te annuleren');
    }
    // Reeds afgeboekt saldo terugstorten.
    if (request.status === LeaveStatus.APPROVED && request.hours) {
      await this.adjustBalance(
        request.employeeId,
        request.type,
        request.startsAt.getFullYear(),
        -request.hours,
      );
    }
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: LeaveStatus.CANCELLED },
      include: leaveInclude,
    });
  }

  /** Saldi van de ingelogde gebruiker (of van een medewerker voor goedkeurders). */
  async balances(user: AuthUser, targetUserId?: string) {
    this.assertCompany(user.companyId);
    const userId =
      targetUserId && this.canApprove(user.role) ? targetUserId : user.userId;
    return this.prisma.leaveBalance.findMany({
      where: { userId },
      orderBy: [{ year: 'desc' }, { type: 'asc' }],
    });
  }

  private async adjustBalance(
    userId: string,
    type: LeaveType,
    year: number,
    deltaUsedHours: number,
  ) {
    const existing = await this.prisma.leaveBalance.findUnique({
      where: { userId_type_year: { userId, type, year } },
    });
    if (existing) {
      await this.prisma.leaveBalance.update({
        where: { id: existing.id },
        data: { usedHours: Math.max(0, existing.usedHours + deltaUsedHours) },
      });
    } else if (deltaUsedHours > 0) {
      await this.prisma.leaveBalance.create({
        data: { userId, type, year, totalHours: 0, usedHours: deltaUsedHours },
      });
    }
  }
}
