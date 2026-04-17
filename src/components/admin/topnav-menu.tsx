'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from '@/styles/admin/topnav-menu.module.css';
import { getBadge } from '@/utils/menu-helper';
import { getMenuItem, topTabs, BadgeCounts } from '@/types/menu-item';
import UserAvatar from '@/components/shared/user-avatar';
import NotificationsBell from '@/components/shared/notifications-bell';
import type { CompanyInfo } from '@/types/company-type';
import type { RoleBranding } from '@/constants/role-branding';
import RoleLogo from '@/components/branding/role-logo';

export default function TopnavMenu({
  badgeCounts,
  isSidebarOpen = false,
  onToggleSidebar,
  variant = 'full',
  userDisplayName,
  userRoleLabel,
  initialCompany,
  branding,
}: Readonly<{
  badgeCounts?: BadgeCounts;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  variant?: 'full' | 'primary' | 'tabs';
  userDisplayName?: string;
  userRoleLabel?: string;
  initialCompany?: CompanyInfo | null;
  branding?: RoleBranding;
}>) {
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

  const showPrimary = variant === 'full' || variant === 'primary';
  const showTabs = variant === 'full' || variant === 'tabs';

  return (
    <>
      {showPrimary ? (
        <header className="bg-teal-deep text-white">
          <div className="flex text-heading font-bold items-center justify-between px-3 sm:px-4 h-16 sm:h-[4.5rem] border-b border-white/10 gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onToggleSidebar}
                aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
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
                className="hidden sm:inline-flex shrink-0 items-center justify-center py-1 leading-none"
              >
                <RoleLogo
                  branding={
                    branding ?? {
                      role: 'role_user',
                      dataRole: 'role_user',
                      displayLabel: 'User',
                      logoSrc: '/logo/logo-icon.png',
                      logoAlt: 'Pop CoLab logo',
                      footerLogoSrc: '/logo/user/logo-full-v.png',
                      footerLogoAlt: 'Pop CoLab user footer logo',
                    }
                  }
                  width={156}
                  height={52}
                  className="block h-[52px] w-auto object-contain"
                />
              </Link>
              <Link
                href="/admin"
                aria-label="Go to dashboard"
                className="sm:hidden inline-flex shrink-0 items-center justify-center py-1 leading-none"
              >
                <RoleLogo
                  branding={
                    branding ?? {
                      role: 'role_user',
                      dataRole: 'role_user',
                      displayLabel: 'User',
                      logoSrc: '/logo/logo-icon.png',
                      logoAlt: 'Pop CoLab logo',
                      footerLogoSrc: '/logo/user/logo-full-v.png',
                      footerLogoAlt: 'Pop CoLab user footer logo',
                    }
                  }
                  width={36}
                  height={18}
                  className="block h-[18px] w-[36px] object-contain"
                />
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                {topTabs.map(t => (
                  <a
                    key={t.label}
                    href={t.href}
                    className="text-heading font-bold text-white hover:text-pink-medium transition-colors whitespace-nowrap"
                  >
                    {t.label}
                  </a>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <NotificationsBell />
              <div className="hidden sm:block w-px h-6 bg-white/20 mx-1" />
              <UserAvatar
                displayName={userDisplayName}
                roleLabel={userRoleLabel}
                initialCompany={initialCompany}
              />
            </div>
          </div>
        </header>
      ) : null}

      {showTabs && resolvedItems.length > 0 ? (
        <div
          className={`flex items-center gap-1 px-4 overflow-x-auto border-b border-black/10 ${styles.tabBar}`}
        >
          {resolvedItems.map(tab => (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex items-center gap-1.5 px-3 py-2.5 whitespace-nowrap transition-colors border-b-2 text-heading font-bold ${
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
      ) : null}
    </>
  );
}
