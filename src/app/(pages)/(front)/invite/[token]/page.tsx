import Link from 'next/link';
import { respondToInvitationAction } from '@/actions/invitation-actions';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { getInvitationByToken } from '@/services/invitation-service';
import { DASHBOARD_REQUESTS_PATH } from '@/utils/url-helper';

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{
    accepted?: string;
    rejected?: string;
    expired?: string;
    error?: string;
  }>;
};

function formatDate(value: Date | null) {
  if (!value) return 'No expiry';
  return new Date(value).toLocaleString();
}

export default async function InvitationPage({
  params,
  searchParams,
}: Readonly<PageProps>) {
  const [{ token }, query, authContext] = await Promise.all([
    params,
    searchParams,
    getCurrentAuthContext(),
  ]);
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-16">
        <div className="w-full rounded-[32px] border border-rose-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Invitation not found
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            This invitation link is invalid or no longer available.
          </p>
        </div>
      </main>
    );
  }

  const respondAction = respondToInvitationAction.bind(null, token);

  return (
    <main className="min-h-screen bg-linear-to-br from-[#f3f7f2] via-[#fffaf4] to-[#eef7fb] px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-gray-200 bg-white p-8 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
          Request Invitation
        </p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          {invitation.userName}, you are invited to join a request
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Request category: <strong>{invitation.requestCategory}</strong>
        </p>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          Invitation email: <strong>{invitation.userEmail}</strong>
        </p>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          Expires at: <strong>{formatDate(invitation.expiredAt)}</strong>
        </p>

        {query.error ? (
          <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Unable to process the invitation response. Please try again.
          </p>
        ) : null}
        {query.accepted ? (
          <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Invitation accepted.{' '}
            {authContext.isAuthenticated
              ? 'You are signed in and can continue from your dashboard.'
              : 'Please complete sign in or sign up if prompted.'}
          </p>
        ) : null}
        {query.rejected ? (
          <p className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Invitation rejected.
          </p>
        ) : null}
        {query.expired || invitation.isExpired ? (
          <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            This invitation has expired.
          </p>
        ) : null}

        <div className="mt-8 rounded-3xl border border-gray-100 bg-gray-50 p-5">
          <p className="text-sm font-medium text-gray-800">
            Current status:{' '}
            <span className="capitalize">{invitation.invitedStatus}</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {invitation.respondAt
              ? `Responded at ${new Date(invitation.respondAt).toLocaleString()}`
              : 'No response yet'}
          </p>
        </div>

        {invitation.invitedStatus === 'pending' && !invitation.isExpired ? (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <form action={respondAction}>
              <input type="hidden" name="action" value="accept" />
              <button
                type="submit"
                className="w-full rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Accept invitation
              </button>
            </form>
            <form action={respondAction}>
              <input type="hidden" name="action" value="reject" />
              <button
                type="submit"
                className="w-full rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Reject invitation
              </button>
            </form>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
          <Link
            href="/"
            className="font-medium text-gray-500 hover:text-gray-900"
          >
            Back to home
          </Link>
          {authContext.isAuthenticated ? (
            <Link
              href={DASHBOARD_REQUESTS_PATH}
              className="font-medium text-teal-700 hover:text-teal-800"
            >
              Go to dashboard
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
