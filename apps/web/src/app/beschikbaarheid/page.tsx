'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getToken } from '@/lib/auth';
import {
  Availability,
  WEEKDAYS,
  fetchAvailability,
  createAvailability,
  deleteAvailability,
} from '@/lib/availability';

export default function AvailabilityPage() {
  const router = useRouter();
  const [items, setItems] = useState<Availability[]>([]);
  const [form, setForm] = useState({ weekday: 1, startTime: '09:00', endTime: '17:00', isAvailable: true });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setItems(await fetchAvailability());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden mislukt');
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    load();
  }, [load, router]);

  async function add() {
    setError('');
    try {
      await createAvailability(form);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toevoegen mislukt');
    }
  }

  const byDay = (d: number) => items.filter((i) => i.weekday === d);

  return (
    <AppShell>
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Beschikbaarheid</h1>
        <p className="text-sm text-white/50">
          Geef door wanneer je (niet) beschikbaar bent. De AI-planner houdt hier rekening mee.
        </p>

        {error && <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Formulier */}
          <div className="glass p-5">
            <h2 className="font-semibold">Blok toevoegen</h2>
            <div className="mt-3 space-y-3">
              <div>
                <label className="label">Dag</label>
                <select className="input" value={form.weekday} onChange={(e) => setForm({ ...form, weekday: Number(e.target.value) })}>
                  {WEEKDAYS.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Van</label>
                  <input type="time" className="input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <div>
                  <label className="label">Tot</label>
                  <input type="time" className="input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.isAvailable ? '1' : '0'} onChange={(e) => setForm({ ...form, isAvailable: e.target.value === '1' })}>
                  <option value="1">✅ Beschikbaar</option>
                  <option value="0">🚫 Niet beschikbaar</option>
                </select>
              </div>
              <button onClick={add} className="btn-primary w-full">Toevoegen</button>
            </div>
          </div>

          {/* Weekoverzicht */}
          <div className="lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <div key={d} className="glass p-4">
                  <h3 className="text-sm font-semibold text-white/80">{WEEKDAYS[d]}</h3>
                  <div className="mt-2 space-y-1.5">
                    {byDay(d).length === 0 ? (
                      <p className="text-xs text-white/30">Geen voorkeur</p>
                    ) : (
                      byDay(d).map((i) => (
                        <div key={i.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm">
                          <span className={i.isAvailable ? 'text-emerald-300' : 'text-red-300'}>
                            {i.isAvailable ? '✅' : '🚫'} {i.startTime}–{i.endTime}
                          </span>
                          <button onClick={() => deleteAvailability(i.id).then(load)} className="text-xs text-white/40 hover:text-red-300">✕</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
