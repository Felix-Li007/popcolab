export type NavItem = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'live' | 'count';
  countKey?: MenuCountKey;
  external?: boolean;
};

export type MenuCountKey =
  | 'overview'
  | 'personalities'
  | 'questions'
  | 'events'
  | 'users'
  | 'bookings'
  | 'facilitators'
  | 'teams'
  | 'requests'
  | 'experiences'
  | 'dimensions';

export type BadgeCounts = Partial<Record<MenuCountKey, number>>;
