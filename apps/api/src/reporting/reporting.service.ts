import { ForbiddenException, Injectable } from '@nestjs/common';
import { ShiftStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface ReportRow {
  employeeId: string;
  employee: string;
  shifts: number;
  hours: number;
  cost: number;
}

export interface HoursCostReport {
  from: string;
  to: string;
  rows: ReportRow[];
  totals: { shifts: number; hours: number; cost: number };
}

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Rapport: geplande uren en personeelskosten per medewerker in een periode,
   * afgeleid uit de toegewezen (niet-geannuleerde) shifts.
   */
  async hoursAndCost(
    companyId: string | null,
    from: string,
    to: string,
  ): Promise<HoursCostReport> {
    if (!companyId) throw new ForbiddenException('Geen bedrijf gekoppeld');
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const shifts = await this.prisma.shift.findMany({
      where: {
        companyId,
        assigneeId: { not: null },
        status: { not: ShiftStatus.CANCELLED },
        startsAt: { gte: fromDate, lte: toDate },
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, hourlyCost: true } },
      },
    });

    const map = new Map<string, ReportRow>();
    for (const s of shifts) {
      if (!s.assignee) continue;
      const hours = Math.max(
        0,
        (s.endsAt.getTime() - s.startsAt.getTime()) / 3_600_000 - (s.breakMinutes ?? 0) / 60,
      );
      const cost = hours * (s.assignee.hourlyCost ?? 0);
      const key = s.assignee.id;
      const existing = map.get(key) ?? {
        employeeId: key,
        employee: `${s.assignee.firstName} ${s.assignee.lastName}`,
        shifts: 0,
        hours: 0,
        cost: 0,
      };
      existing.shifts += 1;
      existing.hours += hours;
      existing.cost += cost;
      map.set(key, existing);
    }

    const rows = [...map.values()]
      .map((r) => ({
        ...r,
        hours: Math.round(r.hours * 100) / 100,
        cost: Math.round(r.cost * 100) / 100,
      }))
      .sort((a, b) => b.hours - a.hours);

    const totals = rows.reduce(
      (acc, r) => ({
        shifts: acc.shifts + r.shifts,
        hours: Math.round((acc.hours + r.hours) * 100) / 100,
        cost: Math.round((acc.cost + r.cost) * 100) / 100,
      }),
      { shifts: 0, hours: 0, cost: 0 },
    );

    return { from, to, rows, totals };
  }
}
