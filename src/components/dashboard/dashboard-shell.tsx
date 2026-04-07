'use client';

import { useEffect, useRef, useState } from 'react';
import DashboardSidenav from '@/components/dashboard/dashboard-sidenav';
import DashboardTopnav from '@/components/dashboard/dashboard-topnav';
import PageFooter from '@/components/shared/page-footer';
import type { CompanyInfo } from '@/types/company-type';
import type { RoleBranding } from '@/constants/role-branding';

export default function DashboardShell({
  children,
  userDisplayName,
  userRoleLabel,
  initialCompany,
  branding,
}: Readonly<{
  children: React.ReactNode;
  userDisplayName?: string;
  userRoleLabel?: string;
  initialCompany?: CompanyInfo | null;
  branding?: RoleBranding;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
    useState(false);
  const sidebarDragStartXRef = useRef<number | null>(null);

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

  useEffect(() => {
    const dragThreshold = 28;

    const onPointerMove = (event: PointerEvent) => {
      if (sidebarDragStartXRef.current === null) return;

      const deltaX = event.clientX - sidebarDragStartXRef.current;
      if (!isDesktopSidebarCollapsed && deltaX <= -dragThreshold) {
        setIsDesktopSidebarCollapsed(true);
        sidebarDragStartXRef.current = null;
      } else if (isDesktopSidebarCollapsed && deltaX >= dragThreshold) {
        setIsDesktopSidebarCollapsed(false);
        sidebarDragStartXRef.current = null;
      }
    };

    const onPointerUp = () => {
      sidebarDragStartXRef.current = null;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [isDesktopSidebarCollapsed]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardTopnav
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        userDisplayName={userDisplayName}
        userRoleLabel={userRoleLabel}
        initialCompany={initialCompany}
        branding={branding}
      />

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
        branding={branding}
      />

      <div className="flex min-h-0 flex-1">
        <div className="relative hidden sm:flex">
          <DashboardSidenav
            className="hidden sm:flex"
            branding={branding}
            collapsed={isDesktopSidebarCollapsed}
          />
          <button
            type="button"
            onPointerDown={event => {
              sidebarDragStartXRef.current = event.clientX;
            }}
            aria-label={
              isDesktopSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
            className="absolute inset-y-0 right-0 z-20 hidden w-1 translate-x-1/2 cursor-ew-resize touch-none bg-transparent shadow-none transition-all duration-200 hover:w-2 hover:bg-transparent hover:shadow-none focus-visible:w-2 focus-visible:bg-transparent focus-visible:shadow-none sm:flex"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col border-l border-black/10">
          <main className="flex-1 overflow-auto" suppressHydrationWarning>
            {children}
          </main>
        </div>
      </div>

      <PageFooter branding={branding} />
    </div>
  );
}
