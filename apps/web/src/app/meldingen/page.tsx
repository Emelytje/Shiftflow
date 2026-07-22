'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getToken } from '@/lib/auth';
import {
  Notification,
  Announcement,
  fetchNotifications,
  fetchAnnouncements,
  markRead,
  markAllRead,
  createAnnouncement,
} from '@/lib/notifications';

function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'zonet';
  if (min < 60) return `${min} min geleden`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} u geleden`;
  return `${Math.floor(h / 24)} d geleden`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [form, setForm] = useState({ title: '', body: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [n, a] = await Promise.all([fetchNotifications(), fetchAnnouncements()]);
      setNotifications(n);
      setAnnouncements(a);
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

  async function onRead(n: Notification) {
    if (!n.readAt) await markRead(n.id);
    if (n.linkUrl) router.push(n.linkUrl);
    else await load();
  }

  async function postAnnouncement() {
    setError('');
    if (!form.title || !form.body) return;
    try {
      await createAnnouncement(form.title, form.body);
      setForm({ title: '', body: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plaatsen mislukt (geen rechten?)');
    }
  }

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Meldingen</h1>
            <p className="text-sm text-white/50">Je meldingen en bedrijfsaankondigingen</p>
          </div>
          <button onClick={() => markAllRead().then(load)} className="btn-ghost px-3 py-1.5 text-sm">
            Alles gelezen
          </button>
        </div>

        {error && <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Meldingen */}
          <div className="glass p-5 lg:col-span-2">
            <h2 className="font-semibold">Meldingen</h2>
            <div className="mt-3 space-y-2">
              {notifications.length === 0 ? (
                <p className="text-sm text-white/40">Geen meldingen.</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => onRead(n)}
                    className={`block w-full rounded-xl border p-3 text-left transition hover:bg-white/10 ${
                      n.readAt ? 'border-white/10 bg-white/5' : 'border-sky-400/30 bg-sky-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{n.title}</span>
                      <span className="text-xs text-white/40">{ago(n.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-white/60">{n.body}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Aankondigingen */}
          <div className="space-y-6">
            <div className="glass p-5">
              <h2 className="font-semibold">Aankondiging plaatsen</h2>
              <p className="mt-1 text-xs text-white/40">Zichtbaar voor iedereen (owner/manager/HR).</p>
              <div className="mt-3 space-y-3">
                <input className="input" placeholder="Titel" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <textarea className="input min-h-[80px]" placeholder="Bericht" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
                <button onClick={postAnnouncement} className="btn-primary w-full">Plaatsen</button>
              </div>
            </div>

            <div className="glass p-5">
              <h2 className="font-semibold">Aankondigingen</h2>
              <div className="mt-3 space-y-2">
                {announcements.length === 0 ? (
                  <p className="text-sm text-white/40">Nog geen aankondigingen.</p>
                ) : (
                  announcements.map((a) => (
                    <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white">📢 {a.title}</span>
                        <span className="text-xs text-white/40">{ago(a.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-white/60">{a.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
