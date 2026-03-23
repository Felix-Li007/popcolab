import {
  createPersonalityAction,
  deletePersonalityAction,
  updatePersonalityAction,
} from '@/actions/personality-actions';
import {
  getDashboardPersonalities,
  getPersonalitySummary,
} from '@/services/personality-service';
import { getOverviewGrowthMetrics } from '@/services/overview-service';
import OverviewContent from '@/components/admin/overview/overview-content';

export default async function OverviewPage() {
  const [personalities, { count, activeCount }, growthMetrics] =
    await Promise.all([
      getDashboardPersonalities(4),
      getPersonalitySummary(),
      getOverviewGrowthMetrics(),
    ]);

  return (
    <OverviewContent
      initialPersonalities={personalities}
      personalitiesCount={count}
      personalitiesActiveCount={activeCount}
      growthMetrics={growthMetrics}
      personalityActions={{
        createPersonalityAction,
        updatePersonalityAction,
        deletePersonalityAction,
      }}
    />
  );
}
