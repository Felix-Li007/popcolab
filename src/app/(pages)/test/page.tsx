import { Suspense } from 'react';
import { getQuestions } from '@/services/question-service';
import type { Question } from '@/types/question-type';
import PersonalityTest from '@/components/test/personality-test';

export default async function TestPage() {
  const questions = await getQuestions();

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">
          No questions available yet. Please check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-800">
          Play Personality Test
        </h1>
        <p className="text-sm text-gray-500">
          Answer honestly — there are no right or wrong answers.
        </p>
      </div>

      <Suspense>
        <PersonalityTest questions={questions as Question[]} />
      </Suspense>
    </div>
  );
}
