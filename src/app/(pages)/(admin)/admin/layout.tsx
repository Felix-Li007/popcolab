import AdminShell from '@/components/admin/admin-shell';
import { getBadgeCounts } from '@/services/statistic-service';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const badgeCounts = await getBadgeCounts();

  return <AdminShell badgeCounts={badgeCounts}>{children}</AdminShell>;
}
