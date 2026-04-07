import { Suspense } from 'react';
import { getQuestions } from '@/services/question-service';
import { FORM_NAME } from '@/types/question-type';
import PersonalityTest from '@/components/front/test/personality-test';

export default async function DashboardTestPage() {
  const questions = await getQuestions(FORM_NAME.ASSESS);

  if (questions.length === 0) {
    return (
      <div className="dashboard-glass-page">
        <div className="dashboard-glass-inner">
          <div className="dashboard-glass-panel py-12 text-center">
            <p className="text-sm text-gray-500">
              No questions available yet. Please check back soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-glass-page">
      <div className="dashboard-glass-inner">
        <div className="flex flex-col gap-5">
          <section className="dashboard-glass-panel p-6 sm:p-8">
            <p className="dashboard-section-eyebrow">Assessment</p>
            <h1 className="dashboard-section-title mt-2">
              Play Personality Test
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Answer honestly. There are no right or wrong answers.
            </p>
          </section>

          <div className="dashboard-glass-panel p-6 sm:p-8">
            <Suspense>
              <PersonalityTest
                questions={questions}
                resultHref="/dashboard/test/result"
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
