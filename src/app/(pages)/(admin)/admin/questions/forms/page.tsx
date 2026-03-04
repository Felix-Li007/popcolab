import { Suspense } from 'react';
import type { IntakeForm } from '@/types/intake-form-type';
import IntakeContent from '@/components/admin/question/intake-content';
import {
  getIntakeDimensionOptions,
  getIntakeForms,
  getIntakeQuestionOptions,
} from '@/services/intake-service';
import { requireAdminPageAccess } from '@/services/admin-auth-service';

export default async function IntakeFormsPage() {
  await requireAdminPageAccess();
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
