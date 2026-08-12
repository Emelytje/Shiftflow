import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role, ShiftStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface Interval {
  start: number;
  end: number;
}

const PLANNER_ROLES: Role[] = [Role.OWNER, Role.MANAGER, Role.TEAM_LEAD];

export interface AutoPlanResult {
  filled: number;
  remainingOpen: number;
  estimatedCost: number;
  assignments: Array<{
    shiftId: string;
    employee: string;
    reason: string;
  }>;
}

/**
 * Regelgebaseerde AI-planner (geen externe kosten).
 * Vult open shifts met de best passende medewerker op basis van:
 *  - geen overlappende shift (harde eis),
 *  - overuren vermijden (t.o.v. contracturen),
 *  - werklast eerlijk spreiden,
 *  - kosten laag houden (uurkost als tiebreaker).
 */
@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  private overlaps(intervals: Interval[], start: number, end: number): boolean {
    return intervals.some((i) => start < i.end && end > i.start);
  }

  async autoPlan(
    user: { companyId: string | null; role: string },
    weekStartIso: string,
  ): Promise<AutoPlanResult> {
    if (!user.companyId) throw new ForbiddenException('Geen bedrijf gekoppeld');
    if (!PLANNER_ROLES.includes(user.role as Role)) {
      throw new ForbiddenException('Alleen planners mogen AI-planning starten');
    }
    const companyId = user.companyId;
    const weekStart = new Date(weekStartIso);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [openShifts, assignedShifts, employees, unavailabilities] = await Promise.all([
      this.prisma.shift.findMany({
        where: { companyId, status: ShiftStatus.OPEN, startsAt: { gte: weekStart, lt: weekEnd } },
        orderBy: { startsAt: 'asc' },
      }),
      this.prisma.shift.findMany({
        where: {
          companyId,
          assigneeId: { not: null },
          status: { not: ShiftStatus.CANCELLED },
          startsAt: { gte: weekStart, lt: weekEnd },
        },
        select: { assigneeId: true, startsAt: true, endsAt: true, breakMinutes: true },
      }),
      this.prisma.user.findMany({
        where: { companyId, role: Role.EMPLOYEE, isActive: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          hourlyCost: true,
          contractHoursPerWeek: true,
        },
      }),
      // Terugkerende "niet-beschikbaar"-blokken per weekdag.
      this.prisma.availability.findMany({
        where: {
          isAvailable: false,
          user: { companyId, role: Role.EMPLOYEE },
          weekday: { not: null },
        },
        select: { userId: true, weekday: true, startTime: true, endTime: true },
      }),
    ]);

    // Index onbeschikbaarheid per medewerker per weekdag.
    const unavailByUser = new Map<string, Array<{ weekday: number; start: string; end: string }>>();
    for (const u of unavailabilities) {
      if (u.weekday === null) continue;
      const list = unavailByUser.get(u.userId) ?? [];
      list.push({ weekday: u.weekday, start: u.startTime, end: u.endTime });
      unavailByUser.set(u.userId, list);
    }
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const isUnavailable = (userId: string, s: Date, e: Date): boolean => {
      const blocks = unavailByUser.get(userId);
      if (!blocks) return false;
      const day = s.getDay();
      const shiftStart = s.getHours() * 60 + s.getMinutes();
      const shiftEnd = e.getHours() * 60 + e.getMinutes();
      return blocks.some(
        (b) => b.weekday === day && shiftStart < toMinutes(b.end) && shiftEnd > toMinutes(b.start),
      );
    };

    // Per medewerker: bezette intervallen + reeds geplande minuten deze week.
    const busy = new Map<string, Interval[]>();
    const plannedMinutes = new Map<string, number>();
    for (const emp of employees) {
      busy.set(emp.id, []);
      plannedMinutes.set(emp.id, 0);
    }
    for (const s of assignedShifts) {
      if (!s.assigneeId || !busy.has(s.assigneeId)) continue;
      busy.get(s.assigneeId)!.push({ start: s.startsAt.getTime(), end: s.endsAt.getTime() });
      const mins = (s.endsAt.getTime() - s.startsAt.getTime()) / 60000 - (s.breakMinutes ?? 0);
      plannedMinutes.set(s.assigneeId, (plannedMinutes.get(s.assigneeId) ?? 0) + mins);
    }

    const assignments: AutoPlanResult['assignments'] = [];
    let estimatedCost = 0;
    // Aantal toewijzingen per medewerker binnen deze AI-run, om de shifts
    // over zoveel mogelijk verschillende mensen te spreiden.
    const assignedThisRun = new Map<string, number>();

    for (const shift of openShifts) {
      const start = shift.startsAt.getTime();
      const end = shift.endsAt.getTime();
      const shiftMinutes = (end - start) / 60000 - (shift.breakMinutes ?? 0);
      const shiftHours = shiftMinutes / 60;

      // Kandidaten zonder conflict én die zich niet onbeschikbaar hebben gemeld.
      const candidates = employees.filter(
        (e) =>
          !this.overlaps(busy.get(e.id)!, start, end) &&
          !isUnavailable(e.id, shift.startsAt, shift.endsAt),
      );
      if (candidates.length === 0) continue;

      // Score (lager = beter).
      let best: { id: string; name: string; score: number; overtime: boolean } | null = null;
      for (const e of candidates) {
        const already = plannedMinutes.get(e.id) ?? 0;
        const projected = already + shiftMinutes;
        const contractMin = (e.contractHoursPerWeek ?? 40) * 60;
        const overtimeMin = Math.max(0, projected - contractMin);
        const cost = (e.hourlyCost ?? 15) * shiftHours;
        const runCount = assignedThisRun.get(e.id) ?? 0;

        const score =
          runCount * 1_000_000 + // spreid eerst over zoveel mogelijk mensen
          overtimeMin * 1000 + // overuren zwaar bestraffen
          already * 0.5 + // werklast spreiden
          cost * 1; // kosten laag houden

        if (!best || score < best.score) {
          best = {
            id: e.id,
            name: `${e.firstName} ${e.lastName}`,
            score,
            overtime: overtimeMin > 0,
          };
        }
      }
      if (!best) continue;

      // Toewijzen (persisteren) + lokale staat bijwerken.
      await this.prisma.shift.update({
        where: { id: shift.id },
        data: { assigneeId: best.id, status: ShiftStatus.ASSIGNED, createdByAi: true },
      });
      busy.get(best.id)!.push({ start, end });
      plannedMinutes.set(best.id, (plannedMinutes.get(best.id) ?? 0) + shiftMinutes);
      assignedThisRun.set(best.id, (assignedThisRun.get(best.id) ?? 0) + 1);

      const emp = employees.find((e) => e.id === best!.id)!;
      estimatedCost += (emp.hourlyCost ?? 15) * shiftHours;
      assignments.push({
        shiftId: shift.id,
        employee: best.name,
        reason: best.overtime
          ? 'Best passende (let op: overuren)'
          : 'Best passende zonder overuren, laagste kost',
      });
    }

    const remainingOpen = openShifts.length - assignments.length;
    return {
      filled: assignments.length,
      remainingOpen,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      assignments,
    };
  }
}
