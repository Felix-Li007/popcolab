import type { BadgeCounts, NavItem } from '@/types/navmenu-type';
export const getBadge = (item: NavItem, counts?: BadgeCounts) => {
  if (
    item.countKey &&
    counts &&
    counts[item.countKey as keyof BadgeCounts] !== undefined
  ) {
    return counts[item.countKey as keyof BadgeCounts];
  }
  return item.badge;
};
