import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ShiftStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { QueryShiftsDto } from './dto/query-shifts.dto';
import { DuplicateWeekDto } from './dto/duplicate-week.dto';
import { NotificationsService } from '../notifications/notifications.service';

function fmtShiftMoment(startsAt: Date): string {
  return startsAt.toLocaleString('nl-BE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const shiftInclude = {
  assignee: { select: { id: true, firstName: true, lastName: true, color: true } },
  department: { select: { id: true, name: true, color: true } },
  location: { select: { id: true, name: true } },
} satisfies Prisma.ShiftInclude;

export interface ShiftConflict {
  type: 'OVERLAP' | 'UNAVAILABLE';
  message: string;
  shiftId?: string;
}

@Injectable()
export class SchedulingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private assertCompany(companyId: string | null): asserts companyId is string {
    if (!companyId) {
      throw new ForbiddenException('Geen bedrijf gekoppeld aan account');
    }
  }

  async findAll(companyId: string | null, query: QueryShiftsDto) {
    this.assertCompany(companyId);
    const where: Prisma.ShiftWhereInput = { companyId };

    if (query.from || query.to) {
      where.startsAt = {};
      if (query.from) (where.startsAt as Prisma.DateTimeFilter).gte = new Date(query.from);
      if (query.to) (where.startsAt as Prisma.DateTimeFilter).lte = new Date(query.to);
    }
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.locationId) where.locationId = query.locationId;
    if (query.assigneeId) where.assigneeId = query.assigneeId;
    if (query.status) where.status = query.status;

    return this.prisma.shift.findMany({
      where,
      include: shiftInclude,
      orderBy: { startsAt: 'asc' },
    });
  }

  async findOne(companyId: string | null, id: string) {
    this.assertCompany(companyId);
    const shift = await this.prisma.shift.findFirst({
      where: { id, companyId },
      include: shiftInclude,
    });
    if (!shift) throw new NotFoundException('Shift niet gevonden');
    return shift;
  }

  /**
   * Detecteert overlappende shifts voor dezelfde medewerker.
   * Twee intervallen overlappen als: startA < endB && endA > startB.
   */
  async detectConflicts(
    companyId: string,
    assigneeId: string | null | undefined,
    startsAt: Date,
    endsAt: Date,
    excludeShiftId?: string,
  ): Promise<ShiftConflict[]> {
    if (!assigneeId) return [];

    const overlapping = await this.prisma.shift.findMany({
      where: {
        companyId,
        assigneeId,
        id: excludeShiftId ? { not: excludeShiftId } : undefined,
        status: { not: ShiftStatus.CANCELLED },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
      select: { id: true, startsAt: true, endsAt: true },
    });

    return overlapping.map((s) => ({
      type: 'OVERLAP' as const,
      shiftId: s.id,
      message: `Medewerker heeft al een shift van ${s.startsAt.toISOString()} tot ${s.endsAt.toISOString()}`,
    }));
  }

  async create(companyId: string | null, dto: CreateShiftDto, force = false) {
    this.assertCompany(companyId);
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (endsAt <= startsAt) {
      throw new BadRequestException('Einde moet na de start liggen');
    }

    const conflicts = await this.detectConflicts(
      companyId,
      dto.assigneeId,
      startsAt,
      endsAt,
    );
    if (conflicts.length > 0 && !force) {
      throw new BadRequestException({
        message: 'Conflict gedetecteerd',
        conflicts,
      });
    }

    const shift = await this.prisma.shift.create({
      data: {
        companyId,
        title: dto.title,
        startsAt,
        endsAt,
        breakMinutes: dto.breakMinutes ?? 0,
        notes: dto.notes,
        color: dto.color,
        locationId: dto.locationId,
        departmentId: dto.departmentId,
        assigneeId: dto.assigneeId,
        status: dto.assigneeId ? ShiftStatus.ASSIGNED : ShiftStatus.OPEN,
      },
      include: shiftInclude,
    });
    if (shift.assigneeId) {
      await this.notifications.notify(
        shift.assigneeId,
        'Nieuwe shift ingepland',
        `Je bent ingepland op ${fmtShiftMoment(shift.startsAt)}.`,
        '/planner',
      );
    }
    return shift;
  }

  async update(companyId: string | null, id: string, dto: UpdateShiftDto, force = false) {
    this.assertCompany(companyId);
    const existing = await this.findOne(companyId, id);

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : existing.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : existing.endsAt;
    if (endsAt <= startsAt) {
      throw new BadRequestException('Einde moet na de start liggen');
    }

    const assigneeId =
      dto.assigneeId !== undefined ? dto.assigneeId : existing.assigneeId;

    const conflicts = await this.detectConflicts(
      companyId,
      assigneeId,
      startsAt,
      endsAt,
      id,
    );
    if (conflicts.length > 0 && !force) {
      throw new BadRequestException({ message: 'Conflict gedetecteerd', conflicts });
    }

    // Auto-status: krijgt een assignee -> ASSIGNED; verliest assignee -> OPEN.
    let status = dto.status ?? existing.status;
    if (dto.assigneeId !== undefined) {
      if (dto.assigneeId && existing.status === ShiftStatus.OPEN) {
        status = ShiftStatus.ASSIGNED;
      } else if (!dto.assigneeId && existing.status === ShiftStatus.ASSIGNED) {
        status = ShiftStatus.OPEN;
      }
    }

    const updated = await this.prisma.shift.update({
      where: { id },
      data: {
        title: dto.title,
        startsAt,
        endsAt,
        breakMinutes: dto.breakMinutes,
        notes: dto.notes,
        color: dto.color,
        locationId: dto.locationId,
        departmentId: dto.departmentId,
        assigneeId,
        status,
        isPublished: dto.isPublished,
      },
      include: shiftInclude,
    });
    // Melding wanneer de shift aan een (andere) medewerker wordt toegewezen.
    if (assigneeId && assigneeId !== existing.assigneeId) {
      await this.notifications.notify(
        assigneeId,
        'Shift toegewezen',
        `Je bent ingepland op ${fmtShiftMoment(updated.startsAt)}.`,
        '/planner',
      );
    }
    return updated;
  }

  async remove(companyId: string | null, id: string) {
    this.assertCompany(companyId);
    await this.findOne(companyId, id);
    await this.prisma.shift.delete({ where: { id } });
    return { success: true };
  }

  /** Publiceert alle shifts in een periode (maakt ze zichtbaar voor werknemers). */
  async publishRange(companyId: string | null, from: string, to: string) {
    this.assertCompany(companyId);
    const result = await this.prisma.shift.updateMany({
      where: {
        companyId,
        startsAt: { gte: new Date(from), lte: new Date(to) },
      },
      data: { isPublished: true },
    });
    return { published: result.count };
  }

  /** Dupliceert een volledige week naar een andere week (templates/herhaling). */
  async duplicateWeek(companyId: string | null, dto: DuplicateWeekDto) {
    this.assertCompany(companyId);
    const source = new Date(dto.sourceWeekStart);
    const target = new Date(dto.targetWeekStart);
    const offsetMs = target.getTime() - source.getTime();
    const sourceEnd = new Date(source.getTime() + 7 * 24 * 60 * 60 * 1000);

    const shifts = await this.prisma.shift.findMany({
      where: { companyId, startsAt: { gte: source, lt: sourceEnd } },
    });

    const keepAssignees = dto.keepAssignees ?? true;
    const created = await this.prisma.$transaction(
      shifts.map((s) =>
        this.prisma.shift.create({
          data: {
            companyId,
            title: s.title,
            startsAt: new Date(s.startsAt.getTime() + offsetMs),
            endsAt: new Date(s.endsAt.getTime() + offsetMs),
            breakMinutes: s.breakMinutes,
            notes: s.notes,
            color: s.color,
            locationId: s.locationId,
            departmentId: s.departmentId,
            assigneeId: keepAssignees ? s.assigneeId : null,
            status: keepAssignees && s.assigneeId ? ShiftStatus.ASSIGNED : ShiftStatus.OPEN,
            isPublished: false,
          },
        }),
      ),
    );

    return { duplicated: created.length };
  }
}
