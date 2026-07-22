'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from './Logo';
import { clearTokens } from '@/lib/auth';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/planner', label: 'Planner', icon: '🗓️' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

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
                {item.label}
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
