import { Suspense } from 'react';
import {
  getQuestions,
  getAvailableDimensions,
} from '@/services/question-service';
import QuestionContent from '@/components/admin/question/question-content';

export default async function SurveysPage() {
  const [questions, availableDimensions] = await Promise.all([
    getQuestions(),
    getAvailableDimensions(),
  ]);

  return (
    <Suspense>
      <QuestionContent
        initialData={questions}
        availableDimensions={availableDimensions}
      />
    </Suspense>
  );
}
