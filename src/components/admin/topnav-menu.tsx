'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/topnav-menu.module.css';
import { getBadge } from '@/utils/menu-helper';
import { getMenuItem, topTabs, BadgeCounts } from '@/types/menu-item';

export default function TopnavMenu({
  badgeCounts,
  isSidebarOpen = false,
  onToggleSidebar,
}: {
  badgeCounts?: BadgeCounts;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const activeItem = getMenuItem(pathname);
  const resolvedItems = (activeItem?.children ?? []).map(item => ({
    ...item,
    badge: getBadge(item, badgeCounts),
  }));

  const activeHref =
    resolvedItems
      .map(tab => tab.href)
      .sort((a, b) => b.length - a.length)
      .find(href => isActive(href)) ?? '';

  return (
    <header className="bg-teal-deep  text-white">
      {/* Top bar */}
      <div className="flex text-heading font-bold items-center justify-between px-3 sm:px-4 h-14 border-b border-white/10 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isSidebarOpen}
            className="sm:hidden w-9 h-9 rounded-md border border-white/20 hover:bg-white/10 flex items-center justify-center shrink-0 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isSidebarOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
          <Link
            href="/admin"
            aria-label="Go to dashboard"
            className="sm:hidden w-8 h-8 rounded-full overflow-hidden shrink-0"
          >
            <Image
              src="/logo/logo-icon.png"
              alt="Pop CoLab"
              width={32}
              height={32}
            />
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            {topTabs.map(t => (
              <a
                key={t.label}
                href={t.href}
                className="text-white/70 hover:text-white transition-colors whitespace-nowrap"
              >
                {t.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Search */}
          <div className="relative hidden sm:block">
            <input
              type="text"
              placeholder="Search..."
              className="bg-white/10 text-white placeholder-white/50 text-xs px-3 py-1.5 rounded-full w-32 md:w-36 focus:outline-none focus:ring-1 focus:ring-white/30"
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
          <div className="hidden sm:block w-px h-6 bg-white/20 mx-1" />
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
      {resolvedItems.length > 0 && (
        <div
          className={`flex items-center gap-1 px-4 overflow-x-auto ${styles.tabBar}`}
        >
          {resolvedItems.map(tab => (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs whitespace-nowrap transition-colors border-b-2 ${
                activeHref === tab.href
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
      )}
    </header>
  );
}
