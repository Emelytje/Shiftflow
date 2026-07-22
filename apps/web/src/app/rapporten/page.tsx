'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getToken } from '@/lib/auth';
import { HoursCostReport, fetchHoursCost, downloadReport } from '@/lib/reports';

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const router = useRouter();
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setDate(today.getDate() - 30);

  const [from, setFrom] = useState(isoDate(monthAgo));
  const [to, setTo] = useState(isoDate(today));
  const [report, setReport] = useState<HoursCostReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetchHoursCost(
        new Date(from).toISOString(),
        new Date(to + 'T23:59:59').toISOString(),
      );
      setReport(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden mislukt');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    load();
  }, [load, router]);

  async function onDownload(format: 'csv' | 'xlsx' | 'pdf') {
    setError('');
    try {
      await downloadReport(
        format,
        new Date(from).toISOString(),
        new Date(to + 'T23:59:59').toISOString(),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download mislukt');
    }
  }

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Rapporten</h1>
            <p className="text-sm text-white/50">Gewerkte uren &amp; personeelskosten per medewerker</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="label">Van</label>
              <input type="date" className="input w-auto py-1.5" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="label">Tot</label>
              <input type="date" className="input w-auto py-1.5" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <button onClick={load} className="btn-primary px-4 py-2 text-sm">Toon</button>
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        {/* Export-knoppen */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-sm text-white/50">Exporteren:</span>
          <button onClick={() => onDownload('csv')} className="btn-ghost px-3 py-1.5 text-sm">📄 CSV</button>
          <button onClick={() => onDownload('xlsx')} className="btn-ghost px-3 py-1.5 text-sm">📊 Excel</button>
          <button onClick={() => onDownload('pdf')} className="btn-ghost px-3 py-1.5 text-sm">📕 PDF</button>
        </div>

        {/* Samenvatting */}
        {report && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="glass p-5">
              <p className="text-sm text-white/60">Totaal shifts</p>
              <p className="mt-1 text-3xl font-bold text-sky-400">{report.totals.shifts}</p>
            </div>
            <div className="glass p-5">
              <p className="text-sm text-white/60">Totaal uren</p>
              <p className="mt-1 text-3xl font-bold text-sky-400">{report.totals.hours.toFixed(1)}u</p>
            </div>
            <div className="glass p-5">
              <p className="text-sm text-white/60">Personeelskosten</p>
              <p className="mt-1 text-3xl font-bold text-sky-400">€ {report.totals.cost.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Tabel */}
        <div className="glass mt-6 overflow-x-auto p-5">
          {loading ? (
            <p className="text-white/40">Laden…</p>
          ) : !report || report.rows.length === 0 ? (
            <p className="text-sm text-white/40">Geen gegevens in deze periode.</p>
          ) : (
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-white/50">
                  <th className="pb-2 font-medium">Medewerker</th>
                  <th className="pb-2 text-right font-medium">Shifts</th>
                  <th className="pb-2 text-right font-medium">Uren</th>
                  <th className="pb-2 text-right font-medium">Kosten</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((r) => (
                  <tr key={r.employeeId} className="border-t border-white/10">
                    <td className="py-2 text-white/85">{r.employee}</td>
                    <td className="py-2 text-right text-white/70">{r.shifts}</td>
                    <td className="py-2 text-right text-white/70">{r.hours.toFixed(2)}u</td>
                    <td className="py-2 text-right text-white/85">€ {r.cost.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="border-t border-white/20 font-semibold">
                  <td className="py-2 text-white">Totaal</td>
                  <td className="py-2 text-right text-white">{report.totals.shifts}</td>
                  <td className="py-2 text-right text-white">{report.totals.hours.toFixed(2)}u</td>
                  <td className="py-2 text-right text-sky-400">€ {report.totals.cost.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
