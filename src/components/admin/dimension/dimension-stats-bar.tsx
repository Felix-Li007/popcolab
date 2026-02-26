import StatsCard from '@/components/admin/stats-card';

type Props = {
  totalCount: number;
  hardFilterCount: number;
  softFilterCount: number;
};

export default function DimensionStatsBar({
  totalCount,
  hardFilterCount,
  softFilterCount,
}: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatsCard
        bgColor="bg-pink-light"
        glowColor="color-mix(in srgb, var(--color-pink-light) 55%, transparent)"
        icon={<span className="text-title">📐</span>}
        value={totalCount}
        label="Dimensions"
        trendLabel="active indexes"
      />
      <StatsCard
        bgColor="bg-green-100"
        glowColor="color-mix(in srgb, var(--color-teal-accent) 55%, transparent)"
        icon={<span className="text-title">⚙️</span>}
        value={hardFilterCount}
        label="Hard Filter"
        trendLabel="strict matching"
      />
      <StatsCard
        bgColor="bg-lavender"
        glowColor="color-mix(in srgb, var(--color-lavender) 50%, transparent)"
        icon={<span className="text-title">🌿</span>}
        value={softFilterCount}
        label="Soft Filter"
        trendLabel="flexible matching"
      />
    </div>
  );
}
