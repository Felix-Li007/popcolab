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
        <label className="inline-flex items-center gap-2 shrink-0">
          <span className="text-caption font-semibold text-foreground/75 whitespace-nowrap">
            HARD FILTER
          </span>
          <input
            type="checkbox"
            checked={hardOnly}
            onChange={event => onHardOnlyChange(event.target.checked)}
            className="sr-only peer"
          />
          <span className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-teal-deep transition-colors relative">
            <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
          </span>
        </label>
      }
    />
  );
}
