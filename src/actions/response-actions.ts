'use server';

import { computeTestResult } from '@/services/response-service';
import type { UserAnswer, TestSubmitResult } from '@/types/response-type';

export async function submitTestAction(
  answers: UserAnswer[]
): Promise<TestSubmitResult> {
  if (answers.length === 0) {
    return { success: false, error: 'No answers were submitted.' };
  }

  try {
    const result = await computeTestResult(answers);
    return {
      success: true,
      personalityKey: result.personalityKey,
      totalScore: result.totalScore,
    };
  } catch {
    return {
      success: false,
      error: 'Failed to compute your result. Please try again.',
    };
  }
}
