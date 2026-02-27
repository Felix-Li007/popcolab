import { Badge, Button } from '@/ui';
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
}: Props) {
  return (
    <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-3 shrink-0">
      <div className="flex-1 min-w-0 flex gap-1 overflow-x-auto">
        <Button
          onClick={() => onCategoryFilterChange('all')}
          variant="tab"
          size="xs"
          isActive={categoryFilter === 'all'}
          className="whitespace-nowrap !h-7 !min-w-0 !px-2 !py-0 !text-caption"
        >
          All
          <Badge
            variant="default"
            size="xs"
            bgColor={categoryFilter === 'all' ? 'bg-white/20' : 'bg-gray-100'}
            textColor={
              categoryFilter === 'all' ? 'text-white' : 'text-gray-500'
            }
          >
            {totalCount}
          </Badge>
        </Button>

        {categories.map(category => {
          const count = categoryCountMap.get(category.id) ?? 0;
          const active = categoryFilter === category.id;
          return (
            <Button
              key={category.id}
              onClick={() => onCategoryFilterChange(category.id)}
              variant="tab"
              size="xs"
              isActive={active}
              className="whitespace-nowrap !h-7 !min-w-0 !px-2 !py-0 !text-caption"
            >
              {category.name}
              <Badge
                variant="default"
                size="xs"
                bgColor={active ? 'bg-white/20' : 'bg-gray-100'}
                textColor={active ? 'text-white' : 'text-gray-500'}
              >
                {count}
              </Badge>
            </Button>
          );
        })}
      </div>

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
    </div>
  );
}
