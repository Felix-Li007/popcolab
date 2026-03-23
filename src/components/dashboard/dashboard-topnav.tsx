'use client';

import Link from 'next/link';
import Image from 'next/image';
import UserAvatar from '@/components/shared/user-avatar';
import type { CompanyInfo } from '@/types/company-type';

export default function DashboardTopnav({
  isSidebarOpen = false,
  onToggleSidebar,
  userDisplayName,
  userRoleLabel,
  initialCompany,
}: Readonly<{
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  userDisplayName?: string;
  userRoleLabel?: string;
  initialCompany?: CompanyInfo | null;
}>) {
  return (
    <header className="bg-teal-deep text-white">
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
            href="/dashboard"
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
          <span className="text-sm font-semibold text-white/80 hidden sm:block">
            My Dashboard
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:block w-px h-6 bg-white/20 mx-1" />
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
