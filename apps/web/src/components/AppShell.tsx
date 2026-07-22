'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from './Logo';
import { clearTokens, getToken } from '@/lib/auth';
import { fetchUnreadCount } from '@/lib/notifications';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/planner', label: 'Planner', icon: '🗓️' },
  { href: '/verlof', label: 'Verlof', icon: '🌴' },
  { href: '/uren', label: 'Uren', icon: '⏱️' },
  { href: '/meldingen', label: 'Meldingen', icon: '🔔' },
  { href: '/rapporten', label: 'Rapporten', icon: '📈' },
  { href: '/beheer', label: 'Beheer', icon: '⚙️' },
  { href: '/account', label: 'Account', icon: '🔒' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!getToken()) return;
    let active = true;
    const poll = () =>
      fetchUnreadCount()
        .then((r) => active && setUnread(r.count))
        .catch(() => undefined);
    poll();
    const id = setInterval(poll, 30_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [pathname]);

  function logout() {
    clearTokens();
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-white/10 bg-navy-900/60 p-5 backdrop-blur md:flex">
        <Logo className="text-lg" />
        <nav className="mt-8 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active
                    ? 'bg-sky-500/20 text-sky-300'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.href === '/meldingen' && unread > 0 && (
                  <span className="rounded-full bg-sky-500 px-1.5 py-0.5 text-xs font-semibold text-navy-900">
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <button onClick={logout} className="btn-ghost mt-auto px-3 py-2 text-sm">
          Uitloggen
        </button>
      </aside>
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
