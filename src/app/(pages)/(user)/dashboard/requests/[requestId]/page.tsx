import { notFound, redirect } from 'next/navigation';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { upsertClerkUser } from '@/services/user-service';
import { getUserRequests } from '@/services/user-request-service';
import { getRequestAttendees } from '@/services/request-attendee-service';
import RequestDetailContent from '@/components/requests/request-detail-content';

type Props = {
  params: Promise<{ requestId: string }>;
};

export default async function RequestDetailPage({ params }: Props) {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated) redirect('/sign-in');

  const clerkUser = authContext.user!;
  const email =
    clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? '';

  const { userId } = await upsertClerkUser(clerkUser.id, email);

  const { requestId: requestIdRaw } = await params;
  const requestId = Number(requestIdRaw);
  if (Number.isNaN(requestId)) notFound();

  const requests = await getUserRequests(userId);
  const request = requests.find(r => r.id === requestId);
  if (!request) notFound();

  const attendeeSummary = await getRequestAttendees(requestId);

  return (
    <div className="dashboard-glass-page">
      <div className="dashboard-glass-inner">
        <div className="dashboard-glass-stack">
          <RequestDetailContent
            request={request}
            attendeeSummary={attendeeSummary}
          />
        </div>
      </div>
    </div>
  );
}
