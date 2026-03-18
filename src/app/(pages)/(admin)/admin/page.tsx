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
import type { Personality } from '@/types/personality-type';
import type { OverviewGrowthMetrics } from '@/types/overview-type';
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
      initialPersonalities={personalities as Personality[]}
      personalitiesCount={count}
      personalitiesActiveCount={activeCount}
      growthMetrics={growthMetrics as OverviewGrowthMetrics}
      personalityActions={{
        createPersonalityAction,
        updatePersonalityAction,
        deletePersonalityAction,
      }}
    />
  );
}
