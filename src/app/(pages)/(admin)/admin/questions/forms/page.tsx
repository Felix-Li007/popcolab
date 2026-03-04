import { Suspense } from 'react';
import type { IntakeForm } from '@/types/intake-form-type';
import IntakeContent from '@/components/admin/question/intake-content';
import {
  getIntakeDimensionOptions,
  getIntakeForms,
  getIntakeQuestionOptions,
} from '@/services/intake-service';

export default async function IntakeFormsPage() {
  const [intakeForms, availableQuestions, availableDimensions] =
    await Promise.all([
      getIntakeForms(),
      getIntakeQuestionOptions(),
      getIntakeDimensionOptions(),
    ]);

  return (
    <Suspense fallback={null}>
      <IntakeContent
        initialData={intakeForms as IntakeForm[]}
        availableQuestions={availableQuestions}
        availableDimensions={availableDimensions}
      />
    </Suspense>
  );
}
