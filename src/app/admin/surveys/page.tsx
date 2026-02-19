import { Suspense } from 'react';
import {
  getQuestions,
  getAvailableDimensions,
} from '@/services/question-service';
import type { QuestionData, DimensionIndexData } from '@/types/question';
import SurveysClient from './SurveysClient';

export default async function SurveysPage() {
  const [questions, availableDimensions] = await Promise.all([
    getQuestions(),
    getAvailableDimensions(),
  ]);

  return (
    <Suspense>
      <SurveysClient
        initialData={questions as QuestionData[]}
        questionsCount={questions.length}
        availableDimensions={availableDimensions as DimensionIndexData[]}
      />
    </Suspense>
  );
}
