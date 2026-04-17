import Link from 'next/link';
import RoleLogo from '@/components/branding/role-logo';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { getTeamInviteByToken } from '@/services/team-invite-service';
import { getTestResult } from '@/services/response-service';
import { upsertClerkUser } from '@/services/user-service';
import { respondToTeamInvite } from '@/services/user-team-service';
import { buildAuthPath } from '@/utils/url-helper';
import { formatStoredPersonalityDate } from '@/utils/personality-time';
import JoinPersonalityChoice from '@/components/teams/join-personality-choice';
import type { RoleBranding } from '@/constants/role-branding';

type PageProps = Readonly<{
  params: Promise<{ token: string }>;
}>;

const INVITE_PANEL_WIDTH_CLASS = 'max-w-[460px]';
const USER_BRANDING: RoleBranding = {
  role: 'role_user',
  dataRole: 'role_user',
  displayLabel: 'User',
  logoSrc: '/logo/user/logo-full-h.png',
  logoAlt: 'Pop CoLab user logo',
  footerLogoSrc: '/logo/user/logo-full-v.png',
  footerLogoAlt: 'Pop CoLab user footer logo',
};

const Logo = () => (
  <div className="bg-[#111827] px-8 py-7 text-center">
    <div className="mb-2 flex items-center justify-center">
      <RoleLogo
        branding={USER_BRANDING}
        width={156}
        height={52}
        className="block h-[52px] w-auto object-contain"
      />
    </div>
    <p className="text-xs text-gray-400">Rediscover the Power of Play</p>
  </div>
);

function InviteShell(
  props: Readonly<{
    children: React.ReactNode;
    maxWidthClassName?: string;
  }>
) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1a1f2e] px-4">
      <div
        className={`w-full overflow-hidden rounded-2xl bg-white shadow-2xl ${props.maxWidthClassName ?? 'max-w-md'}`}
      >
        <Logo />
        {props.children}
      </div>
    </main>
  );
}

function InviteNotice(
  props: Readonly<{
    title: string;
    description: React.ReactNode;
    primaryHref: string;
    primaryLabel: string;
    secondaryHref?: string;
    secondaryLabel?: string;
  }>
) {
  return (
    <InviteShell>
      <div className="px-8 py-7">
        <h1 className="mb-2 text-lg font-bold text-gray-800">{props.title}</h1>
        <div className="mb-6 text-sm text-gray-500">{props.description}</div>
        <div className="flex flex-col gap-3">
          <Link
            href={props.primaryHref}
            className="block w-full rounded-lg bg-[#E91E8C] py-3 text-center text-sm font-semibold text-white hover:bg-[#c7177a]"
          >
            {props.primaryLabel}
          </Link>
          {props.secondaryHref && props.secondaryLabel ? (
            <Link
              href={props.secondaryHref}
              className="text-center text-sm font-semibold text-[#E91E8C] hover:text-[#c7177a]"
            >
              {props.secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </InviteShell>
  );
}

function getPrimaryEmail(
  clerkUser: NonNullable<
    Awaited<ReturnType<typeof getCurrentAuthContext>>['user']
  >
): string {
  return (
    clerkUser.emailAddresses.find(
      entry => entry.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ?? ''
  );
}

export default async function TeamInviteLandingPage({ params }: PageProps) {
  const { token } = await params;
  const invite = await getTeamInviteByToken(token);

  if (!invite) {
    return (
      <InviteNotice
        title="Invite not found"
        description="This invite link is invalid or has already been used."
        primaryHref="/"
        primaryLabel="Back to home"
      />
    );
  }

  if (invite.status === 'accepted') {
    return (
      <InviteNotice
        title="Invite already used"
        description="This invite link has already been used successfully and is no longer valid."
        primaryHref="/dashboard/teams"
        primaryLabel="Go to teams"
      />
    );
  }

  if (invite.isExpired) {
    return (
      <InviteNotice
        title="Invite expired"
        description="This invite link has expired. Ask your team lead to send a new one."
        primaryHref="/"
        primaryLabel="Back to home"
      />
    );
  }

  const authContext = await getCurrentAuthContext();
  const clerkUser = authContext.user;

  if (clerkUser) {
    const email = getPrimaryEmail(clerkUser);
    const { userId } = await upsertClerkUser(clerkUser.id, email);

    try {
      await respondToTeamInvite(invite.id, userId, email, 'accept');
    } catch (error) {
      if (error instanceof Error && error.message === 'Not authorised.') {
        return (
          <InviteNotice
            title="This invite belongs to a different account"
            description={
              <>
                <p className="mb-4">
                  You&apos;re signed in as{' '}
                  <strong>{email || 'your current account'}</strong>, but this
                  team invite was sent to a different person.
                </p>
                {invite.email ? (
                  <p>
                    Expected invite email: <strong>{invite.email}</strong>
                  </p>
                ) : (
                  <p>
                    Please sign in with the invited account, then open this link
                    again.
                  </p>
                )}
              </>
            }
            primaryHref="/dashboard"
            primaryLabel="Go to dashboard"
            secondaryHref="/"
            secondaryLabel="Back to home"
          />
        );
      }

      throw error;
    }

    const testResult = await getTestResult(userId);

    return (
      <InviteShell maxWidthClassName={INVITE_PANEL_WIDTH_CLASS}>
        <JoinPersonalityChoice
          teamName={invite.teamName}
          inviterName={invite.inviterName}
          firstName={clerkUser.firstName ?? ''}
          personality={testResult?.personality ?? null}
          assessedAt={formatStoredPersonalityDate(
            testResult?.completedAt ?? null
          )}
        />
      </InviteShell>
    );
  }

  const continueUrl = invite.isExistingUser
    ? buildAuthPath({
        authAction: 'sign-in',
        redirectPath: `/join/${token}`,
        email: invite.email || undefined,
      })
    : buildAuthPath({
        authAction: 'sign-up',
        redirectPath: `/join/${token}`,
        email: invite.email || undefined,
      });

  return (
    <InviteShell maxWidthClassName={INVITE_PANEL_WIDTH_CLASS}>
      <div className="px-8 py-7">
        <h1 className="mb-1 text-lg font-bold text-gray-800">
          You&apos;ve been invited!
        </h1>
        <p className="mb-5 text-sm text-gray-500">
          Continue to accept your invitation and access Pop CoLab
        </p>

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
          Click Continue to sign in or create an account. Once you&apos;re
          authenticated, we&apos;ll add you to the team and then help you decide
          what to do about your personality test.
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
    </InviteShell>
  );
}
