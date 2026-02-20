import {
  getDashboardPersonalities,
  getPersonalitySummary,
} from '@/services/personality-service';
import { getDashboardQuestions } from '@/services/question-service';
import type { PersonalityType } from '@/types/personality-type';
import type { QuestionData } from '@/types/question';
import OverviewContent from '@/components/admin/overview/overview-content';

export default async function OverviewPage() {
  const [personalities, { count, activeCount }, questions] = await Promise.all([
    getDashboardPersonalities(4),
    getPersonalitySummary(),
    getDashboardQuestions(4),
  ]);

  return (
    <OverviewContent
      initialPersonalities={personalities as PersonalityType[]}
      personalitiesCount={count}
      personalitiesActiveCount={activeCount}
      initialQuestions={questions as QuestionData[]}
    />
  );
}
