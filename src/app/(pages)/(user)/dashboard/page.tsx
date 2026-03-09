import { redirect } from 'next/navigation';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { getUserDashboardData } from '@/services/user-dashboard-service';
import UserDashboardContent from '@/components/dashboard/user-dashboard-content';

export default async function DashboardPage() {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated) redirect('/sign-in');

  const firstName = authContext.user?.firstName?.trim() ?? '';
  const displayName = firstName || authContext.user?.username || 'there';

  const data = await getUserDashboardData(authContext.user!.id);

  return (
    <UserDashboardContent
      displayName={displayName}
      personality={data.personality}
      totalScore={data.totalScore}
      teams={data.teams}
      requests={data.requests}
    />
  );
}
