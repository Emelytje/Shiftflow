'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getToken } from '@/lib/auth';
import {
  TimeEntry,
  fetchCurrent,
  fetchEntries,
  clockIn,
  clockOut,
  approveEntry,
  minutesToHM,
} from '@/lib/time';

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const STATUS_LABEL: Record<string, string> = {
  CLOCKED_IN: 'Ingeklokt',
  CLOCKED_OUT: 'Afgesloten',
  APPROVED: 'Goedgekeurd',
  DISPUTED: 'Betwist',
};

export default function TimePage() {
  const router = useRouter();
  const [current, setCurrent] = useState<TimeEntry | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [elapsed, setElapsed] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, e] = await Promise.all([fetchCurrent(), fetchEntries()]);
      setCurrent(c);
      setEntries(e);
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

  // Live teller voor de lopende registratie.
  useEffect(() => {
    if (!current) {
      setElapsed('');
      return;
    }
    const tick = () => {
      const ms = Date.now() - new Date(current.clockIn).getTime();
      const totalMin = Math.floor(ms / 60000);
      setElapsed(`${Math.floor(totalMin / 60)}u ${String(totalMin % 60).padStart(2, '0')}m`);
    };
    tick();
    const id = setInterval(tick, 1000 * 30);
    return () => clearInterval(id);
  }, [current]);

  async function onClockIn() {
    setError('');
    try {
      await clockIn('WEB');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inklokken mislukt');
    }
  }

  async function onClockOut() {
    setError('');
    try {
      await clockOut(0);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Uitklokken mislukt');
    }
  }

  async function approve(id: string) {
    await approveEntry(id);
    await load();
  }

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Urenregistratie</h1>
            <p className="text-sm text-white/50">Klok in en uit en bekijk je gewerkte uren</p>
          </div>
          <a href="/kiosk" className="btn-ghost px-4 py-2 text-sm">🖥️ Kioskmodus</a>
        </div>

        {error && <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        {/* Klok-widget */}
        <div className="glass-strong mt-6 flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
          <div>
            <p className="text-sm text-white/50">Status</p>
            {current ? (
              <p className="text-xl font-semibold text-emerald-300">
                Ingeklokt · {elapsed}
                <span className="ml-2 text-sm font-normal text-white/50">sinds {fmtDateTime(current.clockIn)}</span>
              </p>
            ) : (
              <p className="text-xl font-semibold text-white/70">Niet ingeklokt</p>
            )}
          </div>
          {current ? (
            <button onClick={onClockOut} className="rounded-xl bg-red-500 px-8 py-3 font-semibold text-white transition hover:bg-red-400">
              Uitklokken
            </button>
          ) : (
            <button onClick={onClockIn} className="rounded-xl bg-emerald-500 px-8 py-3 font-semibold text-navy-900 transition hover:bg-emerald-400">
              Inklokken
            </button>
          )}
        </div>

        {/* Registraties */}
        <div className="glass mt-6 overflow-x-auto p-5">
          <h2 className="font-semibold">Registraties</h2>
          {loading ? (
            <p className="mt-4 text-white/40">Laden…</p>
          ) : entries.length === 0 ? (
            <p className="mt-4 text-sm text-white/40">Nog geen registraties.</p>
          ) : (
            <table className="mt-4 w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left text-white/50">
                  <th className="pb-2 font-medium">Medewerker</th>
                  <th className="pb-2 font-medium">In</th>
                  <th className="pb-2 font-medium">Uit</th>
                  <th className="pb-2 font-medium">Gewerkt</th>
                  <th className="pb-2 font-medium">Over</th>
                  <th className="pb-2 font-medium">Nacht</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-t border-white/10">
                    <td className="py-2 text-white/85">
                      {e.user ? `${e.user.firstName} ${e.user.lastName}` : '—'}
                    </td>
                    <td className="py-2 text-white/70">{fmtDateTime(e.clockIn)}</td>
                    <td className="py-2 text-white/70">{e.clockOut ? fmtDateTime(e.clockOut) : '—'}</td>
                    <td className="py-2 text-white/85">{minutesToHM(e.workedMinutes)}</td>
                    <td className="py-2 text-amber-300/80">{minutesToHM(e.overtimeMinutes)}</td>
                    <td className="py-2 text-sky-300/80">{minutesToHM(e.nightMinutes)}</td>
                    <td className="py-2 text-white/60">{STATUS_LABEL[e.status] ?? e.status}</td>
                    <td className="py-2 text-right">
                      {e.status === 'CLOCKED_OUT' && (
                        <button onClick={() => approve(e.id)} className="rounded-lg border border-emerald-400/30 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10">
                          Goedkeuren
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
