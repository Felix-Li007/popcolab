import DashboardShell from '@/components/dashboard/dashboard-shell';
import PendingResultSaver from '@/components/dashboard/pending-result-saver';
import { getCompanyAction } from '@/actions/user-actions';
import { getCurrentAuthContext } from '@/services/clerk-service';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authContext, companyInfo] = await Promise.all([
    getCurrentAuthContext(),
    getCompanyAction(),
  ]);

  const firstName = authContext.user?.firstName?.trim() ?? '';
  const lastName = authContext.user?.lastName?.trim() ?? '';
  const fullName = (firstName + ' ' + lastName).trim();
  const userDisplayName = fullName || authContext.user?.username || 'User';
  const userRoleLabel = authContext.role ?? 'User';

  return (
    <DashboardShell
      userDisplayName={userDisplayName}
      userRoleLabel={userRoleLabel}
      initialCompany={companyInfo}
    >
      <PendingResultSaver />
      {children}
    </DashboardShell>
  );
}
