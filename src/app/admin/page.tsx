import {
  getDashboardPersonalities,
  getPersonalitySummary,
} from '@/services/personality-service';
import { getDashboardQuestions } from '@/services/question-service';
import type { PersonalityData } from '@/types/personality';
import type { QuestionData } from '@/types/question';
import AdminClient from './AdminClient';

export default async function AdminPage() {
  const [personalities, { count, activeCount }, questions] = await Promise.all([
    getDashboardPersonalities(4),
    getPersonalitySummary(),
    getDashboardQuestions(4),
  ]);

  return (
    <AdminClient
      initialPersonalities={personalities as PersonalityData[]}
      personalitiesCount={count}
      personalitiesActiveCount={activeCount}
      initialQuestions={questions as QuestionData[]}
    />
  );
}
