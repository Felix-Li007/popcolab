'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from '@/styles/top-nav.module.css';
import { BadgeCounts, NavItem } from '@/types/navmenu-type';

const tabs: NavItem[] = [
  { label: 'Overview', countKey: 'overview', href: '/admin' },
  {
    label: 'Personalities',
    countKey: 'personalities',
    href: '/admin/personalities',
  },
  { label: 'Questions', countKey: 'questions', href: '/admin/questions' },
  { label: 'Events', countKey: 'events', href: '/admin/events' },
  { label: 'Users', countKey: 'users', href: '/admin/users' },
  { label: 'Bookings', countKey: 'bookings', href: '/admin/bookings' },
  { label: 'Settings', href: '/admin/settings' },
];

const topTabs: NavItem[] = [
  { label: 'Corporate Teams ○', href: '#' },
  { label: 'Public Group ○', href: '#' },
  { label: 'Facilitators & Partners +', href: '#' },
];

function getBadge(item: NavItem, counts?: BadgeCounts) {
  if (
    item.countKey &&
    counts &&
    counts[item.countKey as keyof BadgeCounts] !== undefined
  ) {
    return counts[item.countKey as keyof BadgeCounts];
  }
  return item.badge;
}

export default function TopnavMenu({
  badgeCounts,
}: {
  personalitiesCount?: number;
  badgeCounts?: BadgeCounts;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const resolvedTabs = tabs.map(tab => ({
    ...tab,
    badge: getBadge(tab, badgeCounts),
  }));

  return (
    <header className="bg-teal-deep text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-white/10 text-xs">
        <nav className="flex items-center gap-4">
          {topTabs.map(t => (
            <a
              key={t.label}
              href={t.href}
              className="text-white/70 hover:text-white transition-colors"
            >
              {t.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="bg-white/10 text-white placeholder-white/50 text-xs px-3 py-1.5 rounded-full w-36 focus:outline-none focus:ring-1 focus:ring-white/30"
            />
            <svg
              className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {/* Notifications */}
          <button
            type="button"
            aria-label="View notifications"
            className="relative w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a2 2 0 002-2H8a2 2 0 002 2z" />
            </svg>
          </button>
          {/* Divider */}
          <div className="w-px h-6 bg-white/20 mx-1" />
          {/* User avatar */}
          <button className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-white/10 transition-colors group">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-magenta to-pink-bright flex items-center justify-center text-xs font-bold shadow-sm">
                DT
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full border-[1.5px] border-teal-deep" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-white leading-tight">
                Donavan T.
              </div>
              <div className="text-[10px] text-white/50 leading-tight">
                Super Admin
              </div>
            </div>
            <svg
              className="w-3 h-3 text-white/40 group-hover:text-white/70 transition-colors hidden sm:block"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className={`flex items-center gap-1 px-4 overflow-x-auto ${styles.tabBar}`}
      >
        {resolvedTabs.map(tab => (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs whitespace-nowrap transition-colors border-b-2 ${
              isActive(tab.href)
                ? 'border-gray-800 text-gray-800 font-bold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className={styles.badge}>{tab.badge}</span>
            )}
          </Link>
        ))}
      </div>
    </header>
  );
}
