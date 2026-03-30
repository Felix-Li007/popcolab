import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/libs/prisma-client';
import { getTestResult } from '@/services/response-service';
import { sanitizeRedirectPath } from '@/utils/auth-redirect';
import PersonalityChoice from '@/components/onboarding/personality-choice';

async function getAssessedAt(userId: number): Promise<string | null> {
  const response = await prisma.response.findFirst({
    where: { user_id: userId, completed_at: { not: null } },
    orderBy: { completed_at: 'desc' },
    select: { completed_at: true },
  });
  return response?.completed_at?.toISOString() ?? null;
}

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

  const user = await prisma.user.findUnique({
    where: { clerk_id: clerkId },
    select: {
      id: true,
      personality_complete: true,
      profile: { select: { first_name: true } },
    },
  });

  if (!user) redirect('/sign-in');

  const [testResult, assessedAt] = user.personality_complete
    ? await Promise.all([getTestResult(user.id), getAssessedAt(user.id)])
    : [null, null];

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1a1f2e] px-4 py-12">
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

        <PersonalityChoice
          firstName={user.profile?.first_name ?? ''}
          personality={testResult?.personality ?? null}
          assessedAt={assessedAt}
          redirectTo={redirectTo}
        />
      </div>
    </main>
  );
}
