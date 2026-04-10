import FilterTabbar from '@/components/shared/filter-tabbar';
import type { DimensionCategory } from '@/types/dimension-type';

type Props = {
  categories: DimensionCategory[];
  categoryFilter: 'all' | number;
  onCategoryFilterChange: (value: 'all' | number) => void;
  categoryCountMap: Map<number, number>;
  totalCount: number;
  hardOnly: boolean;
  onHardOnlyChange: (checked: boolean) => void;
};

export default function DimensionCategoryFilterBar({
  categories,
  categoryFilter,
  onCategoryFilterChange,
  categoryCountMap,
  totalCount,
  hardOnly,
  onHardOnlyChange,
}: Readonly<Props>) {
  const categoryOptions = categories.map(category => ({
    value: category.id,
    label: category.name,
    count: categoryCountMap.get(category.id) ?? 0,
  }));

  return (
    <FilterTabbar
      selected={categoryFilter}
      onChange={onCategoryFilterChange}
      allCount={totalCount}
      options={categoryOptions}
      rightSlot={
        <label
          className="inline-flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1.5"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.78)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.82), rgba(241,245,249,0.66))',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.92), 0 10px 22px rgba(148,163,184,0.12)',
          }}
        >
          <span className="whitespace-nowrap text-caption font-semibold uppercase tracking-[0.14em] text-foreground/65">
            HARD FILTER
          </span>
          <input
            type="checkbox"
            checked={hardOnly}
            onChange={event => onHardOnlyChange(event.target.checked)}
            className="sr-only peer"
          />
          <span className="relative h-5 w-9 rounded-full border border-white/70 bg-slate-300/80 transition-colors peer-checked:bg-teal-deep/90">
            <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-[0_4px_10px_rgba(15,23,42,0.14)] transition-transform peer-checked:translate-x-4" />
          </span>
        </label>
      }
    />
  );
}
