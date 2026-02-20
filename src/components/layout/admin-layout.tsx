import SidenavMenu from '@/components/layout/sidenav-menu';
import TopnavMenu from '@/components/layout/topnav-menu';

export default function AdminLayout({
  children,
  personalitiesCount,
}: {
  children: React.ReactNode;
  personalitiesCount?: number;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidenavMenu personalitiesCount={personalitiesCount} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopnavMenu personalitiesCount={personalitiesCount} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
