import { redirect } from 'next/navigation';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/libs/prisma-client';
import { getTestResult } from '@/services/response-service';
import { upsertClerkUser } from '@/services/user-service';
import { sanitizeRedirectPath } from '@/utils/auth-redirect';
import { formatStoredPersonalityDate } from '@/utils/personality-time';
import PersonalityChoice from '@/components/onboarding/personality-choice';
import RoleLogo from '@/components/branding/role-logo';

type PageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function PersonalityChoicePage({
  searchParams,
}: PageProps) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/sign-in');

  const params = await searchParams;
  const redirectTo = sanitizeRedirectPath(params.redirect, '/dashboard');
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkId).catch(() => null);
  const email =
    clerkUser?.emailAddresses.find(
      entry => entry.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ?? '';
  const { userId } = await upsertClerkUser(clerkId, email);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      personality_complete: true,
      profile: { select: { first_name: true } },
    },
  });

  if (!user) redirect('/sign-in');

  const testResult = user.personality_complete
    ? await getTestResult(user.id)
    : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1a1f2e] px-4 py-12">
      <div className="w-full max-w-[460px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="bg-[#111827] px-8 py-7 text-center">
          <div className="mb-2 flex items-center justify-center">
            <RoleLogo
              branding={{
                role: 'role_user',
                dataRole: 'role_user',
                displayLabel: 'User',
                logoSrc: '/logo/user/logo-full-h.png',
                logoAlt: 'Pop CoLab user logo',
                footerLogoSrc: '/logo/user/logo-full-v.png',
                footerLogoAlt: 'Pop CoLab user footer logo',
              }}
              width={156}
              height={52}
              className="block h-[52px] w-auto object-contain"
            />
          </div>
          <p className="text-xs text-gray-400">Rediscover the Power of Play</p>
        </div>

        <PersonalityChoice
          firstName={user.profile?.first_name ?? ''}
          personality={testResult?.personality ?? null}
          assessedAt={formatStoredPersonalityDate(
            testResult?.completedAt ?? null
          )}
          redirectTo={redirectTo}
        />
      </div>
    </main>
  );
}
