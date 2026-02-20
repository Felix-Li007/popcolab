import { Suspense } from 'react';
import {
  getQuestions,
  getAvailableDimensions,
} from '@/services/question-service';
import type { QuestionData, DimensionIndexData } from '@/types/question';
import QuestionContent from '@/components/admin/question/question-content';

export default async function SurveysPage() {
  const [questions, availableDimensions] = await Promise.all([
    getQuestions(),
    getAvailableDimensions(),
  ]);

  return (
    <Suspense>
      <QuestionContent
        initialData={questions as QuestionData[]}
        questionsCount={questions.length}
        availableDimensions={availableDimensions as DimensionIndexData[]}
      />
    </Suspense>
  );
}
