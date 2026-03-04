import { Suspense } from 'react';
import {
  getQuestions,
  getAvailableDimensions,
} from '@/services/question-service';
import type { Question, DimensionIndex } from '@/types/question-type';
import QuestionContent from '@/components/admin/question/question-content';

export default async function SurveysPage() {
  const [questions, availableDimensions] = await Promise.all([
    getQuestions(),
    getAvailableDimensions(),
  ]);

  return (
    <Suspense>
      <QuestionContent
        initialData={questions as Question[]}
        availableDimensions={availableDimensions as DimensionIndex[]}
      />
    </Suspense>
  );
}
