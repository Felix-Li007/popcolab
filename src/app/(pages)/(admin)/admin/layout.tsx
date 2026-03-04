import AdminShell from '@/components/admin/admin-shell';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { getBadgeCounts } from '@/services/statistic-service';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [badgeCounts, authContext] = await Promise.all([
    getBadgeCounts(),
    getCurrentAuthContext(),
  ]);
  const firstName = authContext.user?.firstName?.trim() ?? '';
  const lastName = authContext.user?.lastName?.trim() ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  const userDisplayName = fullName || authContext.user?.username || 'User';
  const userRoleLabel = authContext.role ?? 'User';

  return (
    <AdminShell
      badgeCounts={badgeCounts}
      userDisplayName={userDisplayName}
      userRoleLabel={userRoleLabel}
    >
      {children}
    </AdminShell>
  );
}
