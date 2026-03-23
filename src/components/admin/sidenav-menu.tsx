'use client';

import AppSidenav, {
  adminStandardSidenavAppearance,
} from '@/components/shared/app-sidenav';
import { getBadge } from '@/utils/menu-helper';
import { menuSection, BadgeCounts } from '@/types/menu-item';
import { menuIcons } from '@/constants/menu-icons';

export default function Sidebar({
  badgeCounts,
  onNavigate,
  className = '',
}: Readonly<{
  badgeCounts?: BadgeCounts;
  onNavigate?: () => void;
  className?: string;
}>) {
  const groups = menuSection.map(section => ({
    title: section.title,
    items: section.items.map(item => ({
      label: item.label,
      href: item.href,
      icon: menuIcons[item.href],
      badge: getBadge(item, badgeCounts),
      badgeVariant: item.badgeVariant,
    })),
  }));

  return (
    <AppSidenav
      groups={groups}
      onNavigate={onNavigate}
      className={className}
      appearance={adminStandardSidenavAppearance}
    />
  );
}
