import { redirect } from 'next/navigation';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { upsertClerkUser } from '@/services/user-service';
import {
  getUserRequests,
  getRequestStats,
} from '@/services/user-request-service';
import RequestsContent from '@/components/requests/requests-content';

export default async function RequestsPage() {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated) redirect('/sign-in');

  const clerkUser = authContext.user!;
  const email =
    clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? '';

  const { userId } = await upsertClerkUser(clerkUser.id, email);

  const [requests, stats] = await Promise.all([
    getUserRequests(userId),
    getRequestStats(userId),
  ]);

  return (
    <div className="p-8">
      <RequestsContent requests={requests} stats={stats} />
    </div>
  );
}
