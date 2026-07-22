'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getToken } from '@/lib/auth';
import { fetchEmployees, Employee } from '@/lib/admin';
import {
  Doc,
  DOC_TYPES,
  docTypeLabel,
  fetchDocuments,
  fetchExpiring,
  uploadDocument,
  downloadDocument,
  deleteDocument,
} from '@/lib/documents';

function fmt(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
function expiringSoon(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() - Date.now() < 30 * 864e5;
}

export default function DocumentsPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [expiring, setExpiring] = useState<Doc[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({ name: '', type: 'CONTRACT', userId: '', expiresAt: '' });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, e] = await Promise.all([fetchDocuments(), fetchExpiring().catch(() => [])]);
      setDocs(d);
      setExpiring(e);
      try {
        setEmployees(await fetchEmployees());
      } catch {
        /* werknemer mag geen medewerkerslijst zien */
      }
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

  async function upload() {
    if (!file) {
      setError('Kies eerst een bestand');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await uploadDocument({
        file,
        name: form.name || file.name,
        type: form.type,
        userId: form.userId || undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      });
      setForm({ name: '', type: 'CONTRACT', userId: '', expiresAt: '' });
      setFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload mislukt (geen rechten?)');
    } finally {
      setBusy(false);
    }
  }

  const canManage = employees.length > 0;

  return (
    <AppShell>
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Documenten</h1>
        <p className="text-sm text-white/50">Contracten, attesten, certificaten en opleidingen</p>

        {error && <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        {expiring.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            ⚠️ {expiring.length} document(en) verlopen binnen 30 dagen.
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {canManage && (
            <div className="glass p-5">
              <h2 className="font-semibold">Uploaden</h2>
              <div className="mt-3 space-y-3">
                <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-500 file:px-3 file:py-1.5 file:text-navy-900" />
                <input className="input" placeholder="Naam (optioneel)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <select className="input" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                  <option value="">Bedrijfsbreed (geen persoon)</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
                <div>
                  <label className="label">Vervaldatum (optioneel)</label>
                  <input type="date" className="input" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
                </div>
                <button onClick={upload} className="btn-primary w-full" disabled={busy}>{busy ? 'Bezig…' : 'Uploaden'}</button>
              </div>
            </div>
          )}

          <div className={`glass overflow-x-auto p-5 ${canManage ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <h2 className="font-semibold">Documenten ({docs.length})</h2>
            {docs.length === 0 ? (
              <p className="mt-3 text-sm text-white/40">Nog geen documenten.</p>
            ) : (
              <table className="mt-3 w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="text-left text-white/50">
                    <th className="pb-2 font-medium">Naam</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Persoon</th>
                    <th className="pb-2 font-medium">Vervalt</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d) => (
                    <tr key={d.id} className="border-t border-white/10">
                      <td className="py-2 text-white/85">{d.name}</td>
                      <td className="py-2 text-white/60">{docTypeLabel(d.type)}</td>
                      <td className="py-2 text-white/60">{d.user ? `${d.user.firstName} ${d.user.lastName}` : '—'}</td>
                      <td className={`py-2 ${expiringSoon(d.expiresAt) ? 'text-amber-300' : 'text-white/60'}`}>{fmt(d.expiresAt)}</td>
                      <td className="py-2 text-right">
                        <button onClick={() => downloadDocument(d.id, d.name)} className="mr-2 text-xs text-sky-300 hover:underline">Download</button>
                        {canManage && <button onClick={() => deleteDocument(d.id).then(load)} className="text-xs text-red-300 hover:underline">Verwijderen</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
