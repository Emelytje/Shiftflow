'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ShiftModal, ShiftDraft, draftFromShift } from '@/components/ShiftModal';
import { getToken } from '@/lib/auth';
import {
  Shift,
  Employee,
  Department,
  ConflictError,
  fetchShifts,
  fetchEmployees,
  fetchDepartments,
  createShift,
  updateShift,
  deleteShift,
  duplicateWeek,
  publishWeek,
  autoPlan,
} from '@/lib/shifts';
import {
  startOfWeek,
  addDays,
  weekDays,
  isSameDay,
  dayLabel,
  timeLabel,
  moveToDay,
  durationHours,
} from '@/lib/dates';

export default function PlannerPage() {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptFilter, setDeptFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState<ShiftDraft | null>(null);

  const days = useMemo(() => weekDays(weekStart), [weekStart]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const from = weekStart.toISOString();
      const to = addDays(weekStart, 7).toISOString();
      const [s, e, c] = await Promise.all([
        fetchShifts(from, to),
        fetchEmployees(),
        fetchDepartments(),
      ]);
      setShifts(s);
      setEmployees(e);
      setDepartments(c.departments ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden mislukt');
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    load();
  }, [load, router]);

  const visibleShifts = useMemo(
    () => (deptFilter ? shifts.filter((s) => s.departmentId === deptFilter) : shifts),
    [shifts, deptFilter],
  );

  function shiftsFor(assigneeId: string | null, day: Date): Shift[] {
    return visibleShifts.filter(
      (s) => (s.assigneeId ?? null) === assigneeId && isSameDay(new Date(s.startsAt), day),
    );
  }

  function weekHoursFor(assigneeId: string): number {
    return visibleShifts
      .filter((s) => s.assigneeId === assigneeId)
      .reduce((sum, s) => sum + durationHours(s.startsAt, s.endsAt, s.breakMinutes), 0);
  }

  // ── Mutaties met conflict-afhandeling ──
  async function persist(fn: (force: boolean) => Promise<unknown>) {
    try {
      await fn(false);
    } catch (err) {
      if (err instanceof ConflictError) {
        if (window.confirm('⚠️ Deze medewerker heeft al een overlappende shift. Toch inplannen?')) {
          await fn(true);
        } else {
          return;
        }
      } else {
        setError(err instanceof Error ? err.message : 'Actie mislukt');
        return;
      }
    }
    await load();
  }

  async function handleDrop(assigneeId: string | null, day: Date, shiftId: string) {
    const shift = shifts.find((s) => s.id === shiftId);
    if (!shift) return;
    const sameDay = isSameDay(new Date(shift.startsAt), day);
    if ((shift.assigneeId ?? null) === assigneeId && sameDay) return;
    await persist((force) =>
      updateShift(
        shiftId,
        {
          assigneeId,
          startsAt: moveToDay(shift.startsAt, day),
          endsAt: moveToDay(shift.endsAt, day),
        },
        force,
      ),
    );
  }

  async function handleSave(payload: Partial<Shift>, id?: string) {
    await persist((force) => (id ? updateShift(id, payload, force) : createShift(payload, force)));
    setDraft(null);
  }

  async function handleDelete(id: string) {
    await deleteShift(id);
    setDraft(null);
    await load();
  }

  function openNew(assigneeId: string | null, day: Date) {
    setDraft({
      day,
      startTime: '09:00',
      endTime: '17:00',
      assigneeId: assigneeId ?? '',
      departmentId: deptFilter || departments[0]?.id || '',
      breakMinutes: 30,
      title: '',
    });
  }

  async function onDuplicate() {
    setNotice('');
    const res = await duplicateWeek(weekStart.toISOString(), addDays(weekStart, 7).toISOString());
    setNotice(`${res.duplicated} shifts gekopieerd naar volgende week.`);
    setWeekStart((w) => addDays(w, 7));
  }

  async function onPublish() {
    setNotice('');
    const res = await publishWeek(weekStart.toISOString(), addDays(weekStart, 7).toISOString());
    setNotice(`${res.published} shifts gepubliceerd.`);
    await load();
  }

  const [aiBusy, setAiBusy] = useState(false);
  async function onAutoPlan() {
    setNotice('');
    setError('');
    setAiBusy(true);
    try {
      const res = await autoPlan(weekStart.toISOString());
      setNotice(
        `🤖 AI-planning: ${res.filled} open shift(s) ingevuld` +
          (res.remainingOpen ? `, ${res.remainingOpen} niet gevuld (geen geschikte medewerker)` : '') +
          `. Geschatte kost: € ${res.estimatedCost.toFixed(2)}.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI-planning mislukt');
    } finally {
      setAiBusy(false);
    }
  }

  const rows: Array<{ id: string | null; label: string; color?: string; hours?: number }> = [
    { id: null, label: 'Open shifts' },
    ...employees.map((e) => ({
      id: e.id,
      label: `${e.firstName} ${e.lastName}`,
      color: e.color,
      hours: weekHoursFor(e.id),
    })),
  ];

  return (
    <AppShell>
      <div className="p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Planner</h1>
            <p className="text-sm text-white/50">
              Week van {dayLabel(days[0])} t/m {dayLabel(days[6])}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <button onClick={() => setWeekStart((w) => addDays(w, -7))} className="btn-ghost px-3 py-1.5 text-sm">‹</button>
              <button onClick={() => setWeekStart(startOfWeek(new Date()))} className="btn-ghost px-3 py-1.5 text-sm">Vandaag</button>
              <button onClick={() => setWeekStart((w) => addDays(w, 7))} className="btn-ghost px-3 py-1.5 text-sm">›</button>
            </div>
            <select className="input w-auto py-1.5 text-sm" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="">Alle afdelingen</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <button onClick={onDuplicate} className="btn-ghost px-3 py-1.5 text-sm">Week dupliceren</button>
            <button onClick={onPublish} className="btn-ghost px-3 py-1.5 text-sm">Publiceren</button>
            <button
              onClick={onAutoPlan}
              disabled={aiBusy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-3 py-1.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {aiBusy ? 'AI plant…' : '🤖 AI-planning'}
            </button>
            <button onClick={() => openNew(null, days[0])} className="btn-primary px-3 py-1.5 text-sm">+ Shift</button>
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        {notice && <p className="mt-4 rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-200">{notice}</p>}

        {/* Grid */}
        <div className="mt-5 overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Kop met dagen */}
            <div className="grid grid-cols-[180px_repeat(7,1fr)] gap-px">
              <div className="glass rounded-lg p-2 text-xs font-medium text-white/50">Medewerker</div>
              {days.map((d) => (
                <div
                  key={d.toISOString()}
                  className={`glass rounded-lg p-2 text-center text-xs font-medium ${
                    isSameDay(d, new Date()) ? 'text-sky-300' : 'text-white/60'
                  }`}
                >
                  {dayLabel(d)}
                </div>
              ))}
            </div>

            {/* Rijen */}
            {loading ? (
              <p className="mt-6 text-center text-white/40">Laden…</p>
            ) : (
              rows.map((row) => (
                <div key={row.id ?? 'open'} className="mt-px grid grid-cols-[180px_repeat(7,1fr)] gap-px">
                  <div className="glass flex items-center justify-between rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      {row.color && <span className="h-2.5 w-2.5 rounded-full" style={{ background: row.color }} />}
                      <span className={`text-sm ${row.id ? 'text-white/85' : 'text-amber-300'}`}>{row.label}</span>
                    </div>
                    {row.hours !== undefined && (
                      <span className="text-xs text-white/40">{row.hours.toFixed(0)}u</span>
                    )}
                  </div>

                  {days.map((day) => {
                    const cellShifts = shiftsFor(row.id, day);
                    return (
                      <div
                        key={day.toISOString()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          const id = e.dataTransfer.getData('text/shiftId');
                          if (id) handleDrop(row.id, day, id);
                        }}
                        onClick={() => cellShifts.length === 0 && openNew(row.id, day)}
                        className="glass min-h-[64px] rounded-lg p-1.5 transition hover:border-sky-400/30"
                      >
                        <div className="space-y-1">
                          {cellShifts.map((s) => (
                            <button
                              key={s.id}
                              draggable
                              onDragStart={(e) => e.dataTransfer.setData('text/shiftId', s.id)}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDraft(draftFromShift(s));
                              }}
                              className="w-full cursor-grab rounded-lg border-l-4 bg-white/10 px-2 py-1 text-left text-xs transition hover:bg-white/20 active:cursor-grabbing"
                              style={{ borderLeftColor: s.color ?? s.department?.color ?? '#38BDF8' }}
                            >
                              <div className="font-medium text-white">
                                {timeLabel(s.startsAt)}–{timeLabel(s.endsAt)}
                              </div>
                              <div className="truncate text-white/60">
                                {s.department?.name ?? s.title ?? 'Shift'}
                                {!s.isPublished && <span className="ml-1 text-amber-300/80">•concept</span>}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        <p className="mt-4 text-xs text-white/40">
          Tip: sleep een shift naar een andere medewerker of dag. Klik in een lege cel om een shift toe te voegen.
        </p>
      </div>

      {draft && (
        <ShiftModal
          draft={draft}
          employees={employees}
          departments={departments}
          onClose={() => setDraft(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </AppShell>
  );
}
