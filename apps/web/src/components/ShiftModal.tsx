'use client';

import { useState } from 'react';
import type { Employee, Department, Shift } from '@/lib/shifts';
import { combineDateTime, timeLabel } from '@/lib/dates';

export interface ShiftDraft {
  id?: string;
  day: Date;
  startTime: string;
  endTime: string;
  assigneeId: string;
  departmentId: string;
  breakMinutes: number;
  title: string;
}

export function draftFromShift(shift: Shift): ShiftDraft {
  return {
    id: shift.id,
    day: new Date(shift.startsAt),
    startTime: timeLabel(shift.startsAt),
    endTime: timeLabel(shift.endsAt),
    assigneeId: shift.assigneeId ?? '',
    departmentId: shift.departmentId ?? '',
    breakMinutes: shift.breakMinutes,
    title: shift.title ?? '',
  };
}

interface Props {
  draft: ShiftDraft;
  employees: Employee[];
  departments: Department[];
  onClose: () => void;
  onSave: (payload: Partial<Shift>, id?: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function ShiftModal({ draft, employees, departments, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState<ShiftDraft>(draft);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set<K extends keyof ShiftDraft>(key: K, value: ShiftDraft[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setError('');
    setBusy(true);
    try {
      const dept = departments.find((d) => d.id === form.departmentId);
      await onSave(
        {
          title: form.title || null,
          startsAt: combineDateTime(form.day, form.startTime),
          endsAt: combineDateTime(form.day, form.endTime),
          assigneeId: form.assigneeId || null,
          departmentId: form.departmentId || null,
          breakMinutes: Number(form.breakMinutes) || 0,
          color: dept?.color ?? null,
        },
        form.id,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-strong w-full max-w-md animate-fade-up p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{form.id ? 'Shift bewerken' : 'Nieuwe shift'}</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="label">Titel (optioneel)</label>
            <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Bv. Ochtenddienst" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start</label>
              <input type="time" className="input" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} />
            </div>
            <div>
              <label className="label">Einde</label>
              <input type="time" className="input" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Afdeling</label>
              <select className="input" value={form.departmentId} onChange={(e) => set('departmentId', e.target.value)}>
                <option value="">—</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Pauze (min)</label>
              <input type="number" min={0} className="input" value={form.breakMinutes} onChange={(e) => set('breakMinutes', Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label className="label">Medewerker</label>
            <select className="input" value={form.assigneeId} onChange={(e) => set('assigneeId', e.target.value)}>
              <option value="">Open shift (niet toegewezen)</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          {form.id && onDelete ? (
            <button
              onClick={() => onDelete(form.id!)}
              className="rounded-xl border border-red-400/30 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
            >
              Verwijderen
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">Annuleren</button>
            <button onClick={save} className="btn-primary px-4 py-2 text-sm" disabled={busy}>
              {busy ? 'Bezig…' : 'Opslaan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
