'use client';

import Link from 'next/link';
import RoleLogo from '@/components/branding/role-logo';
import UserAvatar from '@/components/shared/user-avatar';
import NotificationsBell from '@/components/shared/notifications-bell';
import type { CompanyInfo } from '@/types/company-type';
import type { RoleBranding } from '@/constants/role-branding';

export default function DashboardTopnav({
  isSidebarOpen = false,
  onToggleSidebar,
  userDisplayName,
  userRoleLabel,
  initialCompany,
  branding,
  className = '',
}: Readonly<{
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  userDisplayName?: string;
  userRoleLabel?: string;
  initialCompany?: CompanyInfo | null;
  branding?: RoleBranding;
  className?: string;
}>) {
  const resolvedBranding: RoleBranding = branding ?? {
    role: 'role_user',
    dataRole: 'role_user',
    displayLabel: 'User',
    logoSrc: '/logo/user/logo-full-h.png',
    logoAlt: 'Pop CoLab user logo',
    footerLogoSrc: '/logo/user/logo-full-v.png',
    footerLogoAlt: 'Pop CoLab user footer logo',
  };

  return (
    <header
      className={`bg-(--palette-shell-background) text-(--palette-shell-foreground) ${className}`}
    >
      <div className="flex h-16 items-center justify-between gap-3 border-b border-white/12 px-3 text-heading font-bold sm:h-[4.5rem] sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/20 transition-colors hover:bg-white/10 sm:hidden"
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
            href="/dashboard"
            aria-label="Go to dashboard"
            className="hidden shrink-0 items-center justify-center py-1 leading-none sm:inline-flex"
          >
            <RoleLogo
              branding={resolvedBranding}
              width={156}
              height={52}
              className="block h-[52px] w-auto object-contain"
            />
          </Link>
          <Link
            href="/dashboard"
            aria-label="Go to dashboard"
            className="inline-flex shrink-0 items-center justify-center py-1 leading-none sm:hidden"
          >
            <RoleLogo
              branding={resolvedBranding}
              width={36}
              height={18}
              className="block h-[18px] w-[36px] object-contain"
            />
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <NotificationsBell variant="user" />
          <div className="mx-1 hidden h-6 w-px bg-white/20 sm:block" />
          <UserAvatar
            displayName={userDisplayName}
            roleLabel={userRoleLabel}
            initialCompany={initialCompany}
          />
        </div>
      </div>
    </header>
  );
}
