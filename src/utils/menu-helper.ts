import type { BadgeCounts, MenuItem } from '@/types/menu-item';

export const getBadge = (item: MenuItem, counts?: BadgeCounts) => {
  if (
    item.countKey &&
    counts &&
    counts[item.countKey as keyof BadgeCounts] !== undefined
  ) {
    return counts[item.countKey as keyof BadgeCounts];
  }
  return item.badge;
};
