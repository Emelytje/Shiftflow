'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { register } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tokens = await register(form);
      localStorage.setItem('sf_access', tokens.accessToken);
      localStorage.setItem('sf_refresh', tokens.refreshToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registratie mislukt');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="glass-strong w-full max-w-md animate-fade-up p-8">
        <div className="mb-8 flex justify-center">
          <Logo className="text-2xl" />
        </div>
        <h1 className="text-center text-2xl font-semibold">Start gratis</h1>
        <p className="mt-1 text-center text-sm text-white/60">
          Maak je bedrijfsomgeving in enkele seconden aan
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="firstName">Voornaam</label>
              <input id="firstName" className="input" value={form.firstName} onChange={update('firstName')} required />
            </div>
            <div>
              <label className="label" htmlFor="lastName">Achternaam</label>
              <input id="lastName" className="input" value={form.lastName} onChange={update('lastName')} required />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="companyName">Bedrijfsnaam</label>
            <input id="companyName" className="input" value={form.companyName} onChange={update('companyName')} required />
          </div>
          <div>
            <label className="label" htmlFor="email">E-mailadres</label>
            <input id="email" type="email" className="input" value={form.email} onChange={update('email')} required />
          </div>
          <div>
            <label className="label" htmlFor="password">Wachtwoord (min. 8 tekens)</label>
            <input id="password" type="password" className="input" value={form.password} onChange={update('password')} required minLength={8} />
          </div>

          {error && (
            <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Bezig…' : 'Account aanmaken'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/50">
          Al een account?{' '}
          <Link href="/login" className="text-sky-400 hover:underline">
            Inloggen
          </Link>
        </p>
      </div>
    </main>
  );
}
