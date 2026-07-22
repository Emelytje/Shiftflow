'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { apiFetch } from '@/lib/api';

interface Me {
  firstName: string;
  lastName: string;
  role: string;
  company?: { name: string } | null;
}

interface Company {
  name: string;
  _count: { users: number; shifts: number };
  locations: { id: string; name: string }[];
  departments: { id: string; name: string; color: string }[];
}

const kpis = [
  { label: 'Open diensten', value: '7', hint: 'Deze week' },
  { label: 'Bezettingsgraad', value: '92%', hint: 'Gemiddeld' },
  { label: 'Afwezigheden', value: '3', hint: 'Vandaag' },
  { label: 'Openstaand verlof', value: '1', hint: 'Ter goedkeuring' },
  { label: 'Overuren', value: '12u', hint: 'Deze maand' },
  { label: 'Personeelskosten', value: '€ 8.4k', hint: 'Deze week' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('sf_access');
    if (!token) {
      router.push('/login');
      return;
    }
    (async () => {
      try {
        const [meRes, companyRes] = await Promise.all([
          apiFetch<Me>('/auth/me', { token }),
          apiFetch<Company>('/companies/me', { token }),
        ]);
        setMe(meRes);
        setCompany(companyRes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Laden mislukt');
      }
    })();
  }, [router]);

  function logout() {
    localStorage.removeItem('sf_access');
    localStorage.removeItem('sf_refresh');
    router.push('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-10 mx-4 mt-4 flex items-center justify-between rounded-2xl px-6 py-3">
        <Logo className="text-lg" />
        <div className="flex items-center gap-4">
          <Link href="/planner" className="btn-primary px-4 py-1.5 text-sm">Open planner</Link>
          {me && (
            <span className="hidden text-sm text-white/70 sm:inline">
              {me.firstName} {me.lastName} · <span className="text-sky-400">{me.role}</span>
            </span>
          )}
          <button onClick={logout} className="btn-ghost px-4 py-1.5 text-sm">
            Uitloggen
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold">
          Dashboard{company ? ` · ${company.name}` : ''}
        </h1>
        <p className="mt-1 text-white/60">Overzicht van je personeelsplanning</p>

        {error && (
          <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((k) => (
            <div key={k.label} className="glass animate-fade-up p-5">
              <p className="text-sm text-white/60">{k.label}</p>
              <p className="mt-2 text-3xl font-bold text-sky-400">{k.value}</p>
              <p className="mt-1 text-xs text-white/40">{k.hint}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="glass p-6">
            <h2 className="text-lg font-semibold">Afdelingen</h2>
            <div className="mt-4 space-y-2">
              {company?.departments.length ? (
                company.departments.map((d) => (
                  <div key={d.id} className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                    <span className="text-white/80">{d.name}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/40">Nog geen afdelingen.</p>
              )}
            </div>
          </div>

          <div className="glass p-6">
            <h2 className="text-lg font-semibold">Vestigingen</h2>
            <div className="mt-4 space-y-2">
              {company?.locations.length ? (
                company.locations.map((l) => (
                  <div key={l.id} className="text-white/80">📍 {l.name}</div>
                ))
              ) : (
                <p className="text-sm text-white/40">Nog geen vestigingen.</p>
              )}
            </div>
            {company && (
              <div className="mt-4 flex gap-6 border-t border-white/10 pt-4 text-sm text-white/60">
                <span>👥 {company._count.users} medewerkers</span>
                <span>🗓️ {company._count.shifts} shifts</span>
              </div>
            )}
          </div>
        </section>

        <section className="glass mt-8 p-6">
          <h2 className="text-lg font-semibold">Volgende fases</h2>
          <p className="mt-2 text-sm text-white/60">
            Deze dashboard-shell toont live data uit de API. De volledige planner
            (drag &amp; drop), AI-planning, verlof- en urenmodules worden in de
            volgende ontwikkelfases uitgebouwd.
          </p>
        </section>
      </main>
    </div>
  );
}
