import { getOverviewGrowthMetrics } from '@/services/overview-service';
import OverviewContent from '@/components/admin/overview/overview-content';

export default async function OverviewPage() {
  const growthMetrics = await getOverviewGrowthMetrics();

  return <OverviewContent growthMetrics={growthMetrics} />;
}
