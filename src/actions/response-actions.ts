'use server';

import { currentUser } from '@clerk/nextjs/server';
import {
  submitResponse,
  findOrCreateUserByEmail,
} from '@/services/response-service';
import type { UserAnswer } from '@/types/response-type';
import type { TestSubmitResult } from '@/types/response-type';

export async function submitTestAction(
  answers: UserAnswer[]
): Promise<TestSubmitResult> {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { success: false, error: 'You must be signed in to take the test.' };
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    return { success: false, error: 'No email address found on your account.' };
  }

  if (answers.length === 0) {
    return { success: false, error: 'No answers were submitted.' };
  }

  try {
    const userId = await findOrCreateUserByEmail(
      email,
      clerkUser.fullName ?? undefined
    );
    await submitResponse(userId, answers);
    return { success: true };
  } catch {
    return {
      success: false,
      error: 'Failed to submit your answers. Please try again.',
    };
  }
}
