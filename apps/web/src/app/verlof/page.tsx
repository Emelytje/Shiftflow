'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getToken } from '@/lib/auth';
import {
  LeaveRequest,
  LeaveBalance,
  LEAVE_TYPES,
  leaveTypeLabel,
  fetchLeave,
  fetchBalances,
  createLeave,
  decideLeave,
  cancelLeave,
} from '@/lib/leave';

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
  APPROVED: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  REJECTED: 'bg-red-500/15 text-red-300 border-red-400/30',
  CANCELLED: 'bg-white/10 text-white/50 border-white/15',
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'In behandeling',
  APPROVED: 'Goedgekeurd',
  REJECTED: 'Afgewezen',
  CANCELLED: 'Geannuleerd',
};

function fmt(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export default function LeavePage() {
  const router = useRouter();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [form, setForm] = useState({ type: 'VACATION', startsAt: '', endsAt: '', reason: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, b] = await Promise.all([fetchLeave(), fetchBalances()]);
      setRequests(r);
      setBalances(b);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden mislukt');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    load();
  }, [load, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await createLeave({
        type: form.type,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        reason: form.reason || undefined,
      });
      setForm({ type: 'VACATION', startsAt: '', endsAt: '', reason: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aanvraag mislukt');
    }
  }

  async function decide(id: string, status: 'APPROVED' | 'REJECTED') {
    await decideLeave(id, status);
    await load();
  }

  async function cancel(id: string) {
    await cancelLeave(id);
    await load();
  }

  return (
    <AppShell>
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Verlof</h1>
        <p className="text-sm text-white/50">Vraag verlof aan en beheer aanvragen</p>

        {error && <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Aanvraagformulier + saldi */}
          <div className="space-y-6">
            <form onSubmit={submit} className="glass p-5">
              <h2 className="font-semibold">Nieuwe aanvraag</h2>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {LEAVE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Van</label>
                  <input type="date" className="input" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Tot en met</label>
                  <input type="date" className="input" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Reden (optioneel)</label>
                  <input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                </div>
                <button type="submit" className="btn-primary w-full">Aanvraag indienen</button>
              </div>
            </form>

            <div className="glass p-5">
              <h2 className="font-semibold">Mijn saldi</h2>
              <div className="mt-3 space-y-2">
                {balances.length ? (
                  balances.map((b) => {
                    const left = b.totalHours - b.usedHours;
                    return (
                      <div key={b.id} className="flex items-center justify-between text-sm">
                        <span className="text-white/70">{leaveTypeLabel(b.type)} <span className="text-white/40">{b.year}</span></span>
                        <span className="text-white/85">{left.toFixed(0)}u / {b.totalHours.toFixed(0)}u</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-white/40">Geen saldi bekend.</p>
                )}
              </div>
            </div>
          </div>

          {/* Aanvragenlijst */}
          <div className="glass p-5 lg:col-span-2">
            <h2 className="font-semibold">Aanvragen</h2>
            {loading ? (
              <p className="mt-4 text-white/40">Laden…</p>
            ) : requests.length === 0 ? (
              <p className="mt-4 text-sm text-white/40">Nog geen aanvragen.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {requests.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {r.employee && <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.employee.color }} />}
                        <span className="font-medium text-white">
                          {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : 'Ikzelf'}
                        </span>
                        <span className="text-sm text-white/50">· {leaveTypeLabel(r.type)}</span>
                      </div>
                      <div className="mt-1 text-sm text-white/60">
                        {fmt(r.startsAt)} – {fmt(r.endsAt)}{r.hours ? ` · ${r.hours}u` : ''}
                        {r.reason ? ` · ${r.reason}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs ${STATUS_STYLE[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                      {r.status === 'PENDING' && (
                        <>
                          <button onClick={() => decide(r.id, 'APPROVED')} className="rounded-lg border border-emerald-400/30 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10">Goedkeuren</button>
                          <button onClick={() => decide(r.id, 'REJECTED')} className="rounded-lg border border-red-400/30 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/10">Afwijzen</button>
                          <button onClick={() => cancel(r.id)} className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-white/60 hover:bg-white/10">Annuleren</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
