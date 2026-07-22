'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { login } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('owner@demo.shiftflow.app');
  const [password, setPassword] = useState('Demo1234!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tokens = await login(email, password);
      localStorage.setItem('sf_access', tokens.accessToken);
      localStorage.setItem('sf_refresh', tokens.refreshToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inloggen mislukt');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="glass-strong w-full max-w-md animate-fade-up p-8">
        <div className="mb-8 flex justify-center">
          <Logo className="text-2xl" />
        </div>
        <h1 className="text-center text-2xl font-semibold">Welkom terug</h1>
        <p className="mt-1 text-center text-sm text-white/60">
          Log in op je ShiftFlow-omgeving
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="label" htmlFor="email">E-mailadres</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Wachtwoord</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Bezig…' : 'Inloggen'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/50">
          Nog geen account?{' '}
          <Link href="/register" className="text-sky-400 hover:underline">
            Gratis starten
          </Link>
        </p>
      </div>
    </main>
  );
}
