'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import {
  computeTestResult,
  computeAllPersonalityMatches,
  submitResponse,
} from '@/services/response-service';
import { getCurrentAuthContext } from '@/services/clerk-service';
import { upsertClerkUser } from '@/services/user-service';
import { prisma } from '@/libs/prisma-client';
import type { UserAnswer, TestSubmitResult } from '@/types/response-type';
import type { CurrentAuthContext } from '@/services/clerk-service';

function getPrimaryEmail(
  user: NonNullable<CurrentAuthContext['user']>
): string {
  return (
    user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? ''
  );
}

export async function submitTestAction(
  answers: UserAnswer[]
): Promise<TestSubmitResult> {
  if (answers.length === 0) {
    return { success: false, error: 'No answers were submitted.' };
  }

  try {
    let personalityKey: string;
    let totalScore: number;

    // Use auth() directly — reads session cookie reliably without a Clerk API call.
    // getCurrentAuthContext() fetches the full user object from Clerk's API which
    // can return null on network hiccups, causing the save to be silently skipped.
    const { userId: clerkId } = await auth();

    if (clerkId) {
      // Look up or create the DB user by clerkId. We don't need the email here
      // since upsertClerkUser only uses it on first creation and the user already
      // exists in the DB (they're signed in and on the dashboard).
      let dbUser = await prisma.user.findUnique({
        where: { clerk_id: clerkId },
        select: { id: true, email: true },
      });

      if (!dbUser) {
        // Rare edge case: first time on dashboard before upsert ran elsewhere.
        // Fall back to the full auth context to get the email.
        const authContext = await getCurrentAuthContext();
        const email = authContext.user ? getPrimaryEmail(authContext.user) : '';
        const { userId } = await upsertClerkUser(clerkId, email);
        dbUser = { id: userId, email };
      }

      const result = await submitResponse(dbUser.id, answers);
      personalityKey = result.personalityKey;
      totalScore = result.totalScore;

      // Invalidate the dashboard so it shows the new result immediately.
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/test');
    } else {
      const result = await computeTestResult(answers);
      personalityKey = result.personalityKey;
      totalScore = result.totalScore;
    }

    const allMatches = await computeAllPersonalityMatches(totalScore);
    const matches = allMatches.map(m => `${m.key}:${m.matchPercent}`).join('|');

    return { success: true, personalityKey, totalScore, matches };
  } catch {
    return {
      success: false,
      error: 'Failed to compute your result. Please try again.',
    };
  }
}

export async function savePersonalityKeyAction(
  personalityKey: string
): Promise<{ success: boolean; error?: string }> {
  const authContext = await getCurrentAuthContext();
  if (!authContext.isAuthenticated || !authContext.user) {
    return { success: false, error: 'Not authenticated.' };
  }

  try {
    const email = getPrimaryEmail(authContext.user);
    const { userId } = await upsertClerkUser(authContext.user.id, email);

    // Don't overwrite an existing saved result
    const existing = await prisma.userVector.findUnique({
      where: { user_id: userId },
    });
    if (existing) return { success: true };

    // Use the personality's score threshold as the saved score
    const personality = await prisma.personalityType.findFirst({
      where: { personality_key: personalityKey },
      select: { score_threshold: true },
    });

    const now = new Date();
    const vectorJson = JSON.stringify({
      total: personality?.score_threshold ?? 0,
    });

    await prisma.$transaction(async tx => {
      const response = await tx.response.create({
        data: { user_id: userId, completed_at: now },
      });
      await tx.userVector.create({
        data: {
          user_id: userId,
          response_id: response.id,
          vector_json: vectorJson,
          vector_type: personalityKey,
          updated_at: now,
        },
      });
    });

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to save result.' };
  }
}
