'use client';

import { useEffect, useState } from 'react';
import DashboardSidenav from '@/components/dashboard/dashboard-sidenav';
import DashboardTopnav from '@/components/dashboard/dashboard-topnav';
import PageFooter from '@/components/shared/page-footer';
import type { CompanyInfo } from '@/types/company-type';

export default function DashboardShell({
  children,
  userDisplayName,
  userRoleLabel,
  initialCompany,
}: {
  children: React.ReactNode;
  userDisplayName?: string;
  userRoleLabel?: string;
  initialCompany?: CompanyInfo | null;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 640) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidenav className="hidden sm:flex" />

      <div
        className={
          'fixed inset-0 z-30 bg-black/45 transition-opacity sm:hidden ' +
          (isSidebarOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none')
        }
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      <DashboardSidenav
        onNavigate={() => setIsSidebarOpen(false)}
        className={
          'fixed inset-y-0 left-0 z-40 transition-transform duration-200 sm:hidden ' +
          (isSidebarOpen ? 'translate-x-0' : '-translate-x-full')
        }
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopnav
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          userDisplayName={userDisplayName}
          userRoleLabel={userRoleLabel}
          initialCompany={initialCompany}
        />
        <main className="flex-1 overflow-auto flex flex-col">
          <div className="flex-1">{children}</div>
          <PageFooter />
        </main>
      </div>
    </div>
  );
}
