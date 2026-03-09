import { redirect } from 'next/navigation';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { getUserDashboardData } from '@/services/user-dashboard-service';
import MyRequestsSection from '@/components/dashboard/my-requests-section';

export default async function RequestsPage() {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated) redirect('/sign-in');

  const data = await getUserDashboardData(authContext.user!.id);

  return (
    <div className="p-4 max-w-3xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Experience Requests</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Your submitted activity requests and their current status.
        </p>
      </div>
      <MyRequestsSection requests={data.requests} />
    </div>
  );
}
