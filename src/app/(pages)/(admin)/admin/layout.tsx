import AdminShell from '@/components/admin/admin-shell';
import { getCompanyAction } from '@/actions/user-actions';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { getBadgeCounts } from '@/services/statistic-service';

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [badgeCounts, authContext, companyInfo] = await Promise.all([
    getBadgeCounts(),
    getCurrentAuthContext(),
    getCompanyAction(),
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
      initialCompany={companyInfo}
    >
      {children}
    </AdminShell>
  );
}
