'use client';

import { useEffect, useState } from 'react';
import SidenavMenu from '@/components/admin/sidenav-menu';
import TopnavMenu from '@/components/admin/topnav-menu';
import PageFooter from '@/components/shared/page-footer';
import type { BadgeCounts } from '@/types/menu-item';

export default function AdminShell({
  children,
  badgeCounts,
  userDisplayName,
  userRoleLabel,
}: {
  children: React.ReactNode;
  badgeCounts?: BadgeCounts;
  userDisplayName?: string;
  userRoleLabel?: string;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 640) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <SidenavMenu badgeCounts={badgeCounts} className="hidden sm:flex" />

      <div
        className={`fixed inset-0 z-30 bg-black/45 transition-opacity sm:hidden ${
          isSidebarOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      <SidenavMenu
        badgeCounts={badgeCounts}
        onNavigate={() => setIsSidebarOpen(false)}
        className={`fixed inset-y-0 left-0 z-40 transition-transform duration-200 sm:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopnavMenu
          badgeCounts={badgeCounts}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          userDisplayName={userDisplayName}
          userRoleLabel={userRoleLabel}
        />
        <main className="flex-1 overflow-auto">
          {children}
          <PageFooter />
        </main>
      </div>
    </div>
  );
}
