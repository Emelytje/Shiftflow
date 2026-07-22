'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { getToken } from '@/lib/auth';
import { KioskEmployee, fetchKioskRoster, kioskToggle } from '@/lib/kiosk';

export default function KioskPage() {
  const router = useRouter();
  const [roster, setRoster] = useState<KioskEmployee[]>([]);
  const [clock, setClock] = useState('');
  const [flash, setFlash] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setRoster(await fetchKioskRoster());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden mislukt (leidinggevende nodig)');
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    load();
  }, [load, router]);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  async function toggle(emp: KioskEmployee) {
    try {
      const res = await kioskToggle(emp.id);
      setFlash(`${emp.firstName} ${res.action === 'CLOCK_IN' ? 'ingeklokt ✅' : 'uitgeklokt 👋'}`);
      setTimeout(() => setFlash(''), 2500);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Actie mislukt');
    }
  }

  return (
    <div className="min-h-screen p-6">
      <header className="flex items-center justify-between">
        <Logo className="text-xl" />
        <div className="text-right">
          <div className="text-4xl font-bold tabular-nums text-white">{clock}</div>
          <Link href="/dashboard" className="text-xs text-white/40 hover:text-white/70">Kiosk verlaten</Link>
        </div>
      </header>

      <div className="mt-2 text-center">
        <h1 className="text-2xl font-semibold">Kiosk — tik om in of uit te klokken</h1>
        {flash && <p className="mt-2 inline-block rounded-full bg-emerald-500/20 px-4 py-1.5 text-emerald-200">{flash}</p>}
        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {roster.map((e) => (
          <button
            key={e.id}
            onClick={() => toggle(e)}
            className={`glass-strong flex flex-col items-center gap-3 p-6 transition hover:scale-[1.03] ${
              e.clockedIn ? 'ring-2 ring-emerald-400/50' : ''
            }`}
          >
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-navy-900"
              style={{ background: e.color }}
            >
              {e.firstName[0]}{e.lastName[0]}
            </span>
            <span className="text-lg font-medium text-white">{e.firstName} {e.lastName}</span>
            <span className={`rounded-full px-3 py-1 text-sm ${e.clockedIn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/50'}`}>
              {e.clockedIn ? '● Ingeklokt' : 'Uitgeklokt'}
            </span>
          </button>
        ))}
      </div>
      {roster.length === 0 && !error && (
        <p className="mt-10 text-center text-white/40">Geen actieve medewerkers.</p>
      )}
    </div>
  );
}
