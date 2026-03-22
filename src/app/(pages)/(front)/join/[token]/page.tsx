import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTeamInviteByToken } from '@/services/team-invite-service';
import { buildAuthPath } from '@/utils/url-helper';

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function TeamInviteLandingPage({ params }: PageProps) {
  const { token } = await params;
  const invite = await getTeamInviteByToken(token);

  if (!invite) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1a1f2e] px-4">
        <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="bg-[#111827] px-8 py-7 text-center">
            <div className="mb-1 flex items-center justify-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E91E8C]">
                <span className="text-xs font-bold text-white">PC</span>
              </div>
              <span className="text-base font-bold text-white">Pop CoLab</span>
            </div>
            <p className="text-xs text-gray-400">
              Rediscover the Power of Play
            </p>
          </div>
          <div className="px-8 py-7">
            <h1 className="mb-2 text-lg font-bold text-gray-800">
              Invite not found
            </h1>
            <p className="mb-6 text-sm text-gray-500">
              This invite link is invalid or has already been used.
            </p>
            <Link
              href="/"
              className="text-sm font-semibold text-[#E91E8C] hover:text-[#c7177a]"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (invite.isExpired) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1a1f2e] px-4">
        <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="bg-[#111827] px-8 py-7 text-center">
            <div className="mb-1 flex items-center justify-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E91E8C]">
                <span className="text-xs font-bold text-white">PC</span>
              </div>
              <span className="text-base font-bold text-white">Pop CoLab</span>
            </div>
            <p className="text-xs text-gray-400">
              Rediscover the Power of Play
            </p>
          </div>
          <div className="px-8 py-7">
            <h1 className="mb-2 text-lg font-bold text-gray-800">
              Invite expired
            </h1>
            <p className="mb-6 text-sm text-gray-500">
              This invite link has expired. Ask your team lead to send a new
              one.
            </p>
            <Link
              href="/"
              className="text-sm font-semibold text-[#E91E8C] hover:text-[#c7177a]"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Build the sign-up URL — new users go to intake form after sign-up
  const continueUrl = buildAuthPath({
    authAction: 'sign-up',
    redirectPath: '/onboarding/intake',
    email: invite.email,
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1a1f2e] px-4">
      <div className="w-full max-w-[460px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="bg-[#111827] px-8 py-7 text-center">
          <div className="mb-1 flex items-center justify-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E91E8C]">
              <span className="text-xs font-bold text-white">PC</span>
            </div>
            <span className="text-base font-bold text-white">Pop CoLab</span>
          </div>
          <p className="text-xs text-gray-400">Rediscover the Power of Play</p>
        </div>

        {/* Body */}
        <div className="px-8 py-7">
          <h1 className="mb-1 text-lg font-bold text-gray-800">
            You&apos;ve been invited!
          </h1>
          <p className="mb-5 text-sm text-gray-500">
            Continue to accept your invitation and access Pop CoLab
          </p>

          {/* Team context */}
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <span className="mt-0.5 text-xl">✉️</span>
            <div>
              <p className="text-sm font-bold text-green-800">
                Invited to: {invite.teamName}
              </p>
              <p className="text-xs text-green-700">
                By <strong>{invite.inviterName}</strong> · Pop CoLab
              </p>
            </div>
          </div>

          <p className="mb-5 text-xs text-gray-500">
            Click Continue — you&apos;ll be asked to sign in or create an
            account, then you&apos;ll automatically join the team.
          </p>

          <Link
            href={continueUrl}
            className="block w-full rounded-lg bg-[#E91E8C] py-3 text-center text-sm font-semibold text-white hover:bg-[#c7177a]"
          >
            Continue →
          </Link>

          <p className="mt-4 text-center text-xs text-gray-400">
            Sign in or sign up handled securely by Clerk on the next screen
          </p>
        </div>
      </div>
    </main>
  );
}
