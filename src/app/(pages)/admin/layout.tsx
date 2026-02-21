import SidenavMenu from '@/components/layout/sidenav-menu';
import TopnavMenu from '@/components/layout/topnav-menu';
import { getBadgeCounts } from '@/services/statistic-service';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const badgeCounts = await getBadgeCounts();
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidenavMenu badgeCounts={badgeCounts} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopnavMenu badgeCounts={badgeCounts} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
