import type { ReactNode } from 'react';
import { Badge, Button } from '@/ui';
import styles from '@/styles/filter-tabbar.module.css';

type FilterOption<T extends string | number> = {
  value: T;
  label: string;
  count: number;
};

type Props<T extends string | number> = {
  selected: 'all' | T;
  onChange: (value: 'all' | T) => void;
  options: ReadonlyArray<FilterOption<T>>;
  allCount: number;
  allLabel?: string;
  rightSlot?: ReactNode;
};

export default function FilterTabbar<T extends string | number>({
  selected,
  onChange,
  options,
  allCount,
  allLabel = 'All',
  rightSlot,
}: Props<T>) {
  return (
    <div className={styles.root}>
      <div className={styles.tabs}>
        <Button
          onClick={() => onChange('all')}
          variant="tab"
          size="xs"
          isActive={selected === 'all'}
          className="whitespace-nowrap !h-7 !min-w-0 !px-2 !py-0 !text-caption"
        >
          {allLabel}
          <Badge
            variant="default"
            size="xs"
            bgColor={selected === 'all' ? 'bg-white/20' : 'bg-gray-100'}
            textColor={selected === 'all' ? 'text-white' : 'text-gray-500'}
          >
            {allCount}
          </Badge>
        </Button>

        {options.map(option => {
          const isActive = selected === option.value;
          return (
            <Button
              key={option.value}
              onClick={() => onChange(option.value)}
              variant="tab"
              size="xs"
              isActive={isActive}
              className="whitespace-nowrap !h-7 !min-w-0 !px-2 !py-0 !text-caption"
            >
              {option.label}
              <Badge
                variant="default"
                size="xs"
                bgColor={isActive ? 'bg-white/20' : 'bg-gray-100'}
                textColor={isActive ? 'text-white' : 'text-gray-500'}
              >
                {option.count}
              </Badge>
            </Button>
          );
        })}
        {rightSlot && <div className={styles.rightSlot}>{rightSlot}</div>}
      </div>
    </div>
  );
}
