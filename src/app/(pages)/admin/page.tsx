import {
  getDashboardPersonalities,
  getPersonalitySummary,
} from '@/services/personality-service';
import { getDashboardQuestions } from '@/services/question-service';
import type { Personality } from '@/types/personality-type';
import type { Question } from '@/types/question-type';
import OverviewContent from '@/components/admin/overview/overview-content';

export default async function OverviewPage() {
  const [personalities, { count, activeCount }, questions] = await Promise.all([
    getDashboardPersonalities(4),
    getPersonalitySummary(),
    getDashboardQuestions(4),
  ]);

  return (
    <OverviewContent
      initialPersonalities={personalities as Personality[]}
      personalitiesCount={count}
      personalitiesActiveCount={activeCount}
      initialQuestions={questions as Question[]}
    />
  );
}
