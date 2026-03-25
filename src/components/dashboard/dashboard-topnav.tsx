'use client';

import UserAvatar from '@/components/shared/user-avatar';
import type { CompanyInfo } from '@/types/company-type';

export default function DashboardTopnav({
  isSidebarOpen = false,
  onToggleSidebar,
  userDisplayName,
  userRoleLabel,
  initialCompany,
  className = '',
}: Readonly<{
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  userDisplayName?: string;
  userRoleLabel?: string;
  initialCompany?: CompanyInfo | null;
  className?: string;
}>) {
  return (
    <header
      className={`bg-(--palette-shell-background) text-(--palette-shell-foreground) ${className}`}
    >
      <div className="flex text-heading font-bold items-center justify-between px-3 sm:px-4 h-16 sm:h-[4.5rem] border-b border-[rgba(1,43,48,0.10)] gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
            className="sm:hidden w-9 h-9 rounded-md border border-[rgba(1,43,48,0.18)] hover:bg-[rgba(1,43,48,0.06)] flex items-center justify-center shrink-0 transition-colors"
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
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:block w-px h-6 bg-[rgba(1,43,48,0.15)] mx-1" />
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
