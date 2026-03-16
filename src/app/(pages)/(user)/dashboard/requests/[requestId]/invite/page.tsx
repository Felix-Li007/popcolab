import { redirect } from 'next/navigation';
import RequestInviteForm from '@/components/dashboard/request-invite-form';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { getOwnedRequestInvitationData } from '@/services/invitation-service';
import { DASHBOARD_REQUESTS_PATH } from '@/utils/url-helper';

type PageProps = {
  params: Promise<{ requestId: string }>;
};

export default async function RequestInvitePage({ params }: PageProps) {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated || !authContext.user) {
    redirect('/sign-in');
  }

  const { requestId } = await params;
  const parsedRequestId = Number(requestId);
  if (!Number.isInteger(parsedRequestId) || parsedRequestId <= 0) {
    redirect(DASHBOARD_REQUESTS_PATH);
  }

  const request = await getOwnedRequestInvitationData({
    clerkUserId: authContext.user.id,
    requestId: parsedRequestId,
  });

  if (!request) {
    redirect(DASHBOARD_REQUESTS_PATH);
  }

  return (
    <div className="max-w-4xl p-4">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">
          Request #{request.id}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Invite participants
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Request category: {request.objectiveCategory}
        </p>
      </div>

      <RequestInviteForm
        requestId={request.id}
        existingInvites={request.invitedUsers}
      />
    </div>
  );
}
