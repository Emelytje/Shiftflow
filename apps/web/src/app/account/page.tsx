'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getToken, clearTokens } from '@/lib/auth';
import {
  Me,
  TwoFactorSetup,
  fetchMe,
  setup2fa,
  enable2fa,
  disable2fa,
  exportMyData,
  eraseMe,
} from '@/lib/account';

export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setMe(await fetchMe());
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

  async function startSetup() {
    setError('');
    setMsg('');
    try {
      setSetup(await setup2fa());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon 2FA niet starten');
    }
  }

  async function confirmEnable() {
    setError('');
    try {
      await enable2fa(code);
      setSetup(null);
      setCode('');
      setMsg('Tweestapsverificatie is ingeschakeld ✓');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code ongeldig');
    }
  }

  async function turnOff() {
    setError('');
    try {
      await disable2fa(code);
      setCode('');
      setMsg('Tweestapsverificatie is uitgeschakeld');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code ongeldig');
    }
  }

  async function downloadData() {
    setError('');
    try {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'shiftflow-mijn-gegevens.json';
      a.click();
      URL.revokeObjectURL(url);
      setMsg('Je gegevens zijn gedownload.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export mislukt');
    }
  }

  async function deleteAccount() {
    if (!me) return;
    if (!window.confirm('Weet je zeker dat je je account wil laten verwijderen? Je gegevens worden geanonimiseerd en je wordt uitgelogd.')) {
      return;
    }
    try {
      await eraseMe(me.id);
      clearTokens();
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verwijderen mislukt');
    }
  }

  return (
    <AppShell>
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Account &amp; beveiliging</h1>
        <p className="text-sm text-white/50">Beheer je beveiliging en privacy</p>

        {msg && <p className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{msg}</p>}
        {error && <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* 2FA */}
          <div className="glass p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Tweestapsverificatie (2FA)</h2>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs ${me?.twoFactorEnabled ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300' : 'border-white/15 bg-white/10 text-white/50'}`}>
                {me?.twoFactorEnabled ? 'Ingeschakeld' : 'Uitgeschakeld'}
              </span>
            </div>
            <p className="mt-2 text-sm text-white/60">
              Beveilig je account met een authenticator-app (Google Authenticator, Authy, Microsoft Authenticator).
            </p>

            {!me?.twoFactorEnabled && !setup && (
              <button onClick={startSetup} className="btn-primary mt-4">2FA instellen</button>
            )}

            {setup && (
              <div className="mt-4 space-y-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={setup.qrDataUrl} alt="QR-code" className="h-44 w-44 rounded-lg bg-white p-2" />
                <p className="text-xs text-white/50">
                  Scan de QR-code, of voer deze sleutel handmatig in:
                  <code className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-white/80">{setup.secret}</code>
                </p>
                <input className="input" placeholder="6-cijferige code" value={code} onChange={(e) => setCode(e.target.value)} />
                <button onClick={confirmEnable} className="btn-primary">Inschakelen</button>
              </div>
            )}

            {me?.twoFactorEnabled && (
              <div className="mt-4 space-y-3">
                <input className="input" placeholder="Huidige 2FA-code" value={code} onChange={(e) => setCode(e.target.value)} />
                <button onClick={turnOff} className="btn-ghost">2FA uitschakelen</button>
              </div>
            )}
          </div>

          {/* Privacy / GDPR */}
          <div className="glass p-6">
            <h2 className="font-semibold">Privacy &amp; gegevens (GDPR)</h2>
            <p className="mt-2 text-sm text-white/60">
              Je hebt recht op inzage in en verwijdering van je persoonsgegevens.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <button onClick={downloadData} className="btn-ghost">Mijn gegevens downloaden</button>
                <p className="mt-1 text-xs text-white/40">Exporteert al je gegevens als JSON (art. 15 &amp; 20).</p>
              </div>
              <div className="border-t border-white/10 pt-3">
                <button onClick={deleteAccount} className="rounded-xl border border-red-400/30 px-5 py-2.5 font-medium text-red-300 transition hover:bg-red-500/10">
                  Account verwijderen
                </button>
                <p className="mt-1 text-xs text-white/40">Anonimiseert je gegevens (recht op vergetelheid, art. 17).</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
