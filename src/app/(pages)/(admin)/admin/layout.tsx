import AdminShell from '@/components/admin/admin-shell';
import { getCompanyAction } from '@/actions/user-actions';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { getBadgeCounts } from '@/services/statistic-service';
import { resolveRoleBranding } from '@/constants/role-branding';

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
  const branding = resolveRoleBranding(authContext.role, companyInfo);

  return (
    <AdminShell
      badgeCounts={badgeCounts}
      userDisplayName={userDisplayName}
      userRoleLabel={branding.displayLabel}
      initialCompany={companyInfo}
      branding={branding}
    >
      {children}
    </AdminShell>
  );
}
