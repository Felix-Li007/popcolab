import type { BadgeCounts, MenuItem } from '@/types/menu-item';

export const getBadge = (item: MenuItem, counts?: BadgeCounts) => {
  if (item.countKey && counts?.[item.countKey] !== undefined) {
    return counts[item.countKey];
  }
  return item.badge;
};
