import DashboardShell from '@/components/dashboard/dashboard-shell';
import PendingResultSaver from '@/components/dashboard/pending-result-saver';
import { getCompanyAction } from '@/actions/user-actions';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { resolveRoleBranding } from '@/constants/role-branding';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [authContext, companyInfo] = await Promise.all([
    getCurrentAuthContext(),
    getCompanyAction(),
  ]);

  const firstName = authContext.user?.firstName?.trim() ?? '';
  const lastName = authContext.user?.lastName?.trim() ?? '';
  const fullName = (firstName + ' ' + lastName).trim();
  const userDisplayName = fullName || authContext.user?.username || 'User';
  const branding = resolveRoleBranding(authContext.role, companyInfo);

  return (
    <DashboardShell
      userDisplayName={userDisplayName}
      userRoleLabel={branding.displayLabel}
      initialCompany={companyInfo}
      branding={branding}
    >
      <PendingResultSaver />
      {children}
    </DashboardShell>
  );
}
