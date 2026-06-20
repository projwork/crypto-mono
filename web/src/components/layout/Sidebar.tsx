'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './nav';

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path
            d="M12 2v20M7 6l5-4 5 4M7 18l5 4 5-4"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          LagerPay
        </p>
        <p className="text-[11px] text-slate-400">Crypto → ETB</p>
      </div>
    </Link>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  return (
    <div className="flex h-full flex-col gap-6 border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-950">
      <Logo />
      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                active
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100',
              )}
            >
              <span
                className={cn(
                  'h-4 w-4',
                  active ? 'text-indigo-600 dark:text-indigo-400' : '',
                )}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Updated Help Box with PDF messaging */}
      <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
        <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider dark:text-slate-200">
          Security Notice
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          Funds are protected through advanced multi-signature custody and
          real-time settlement.
        </p>
      </div>
    </div>
  );
}
