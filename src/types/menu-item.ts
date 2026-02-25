export type MenuItem = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'live' | 'count';
  countKey?: CountKey;
  external?: boolean;
};

export type CountKey =
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

export type BadgeCounts = Partial<Record<CountKey, number>>;

export type MenuTree = MenuItem & {
  children: MenuItem[];
};

export type MenuGroup = {
  title: string;
  items: MenuTree[];
};

export const menuSection: MenuGroup[] = [
  {
    title: 'OVERVIEW',
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        countKey: 'overview',
        children: [{ label: 'Overview', href: '/admin', countKey: 'overview' }],
      },
    ],
  },
  {
    title: 'PLAY CONTENT',
    items: [
      {
        label: 'Personalities',
        href: '/admin/personalities',
        countKey: 'personalities',
        children: [
          {
            label: 'Personalities',
            href: '/admin/personalities',
            countKey: 'personalities',
          },
          { label: 'Play Types', href: '/admin/personalities/play-type' },
          { label: 'Play Natures', href: '/admin/personalities/play-nature' },
        ],
      },
      {
        label: 'Questions',
        href: '/admin/questions',
        countKey: 'questions',
        badge: 12,
        children: [
          {
            label: 'Questions',
            href: '/admin/questions',
            countKey: 'questions',
          },
        ],
      },
      {
        label: 'Experiences',
        href: '/admin/experiences',
        countKey: 'experiences',
        badge: '50+',
        children: [
          {
            label: 'Experiences',
            href: '/admin/experiences',
            countKey: 'experiences',
          },
        ],
      },
      {
        label: 'Dimensions',
        href: '/admin/dimensions',
        countKey: 'dimensions',
        children: [
          {
            label: 'Dimensions',
            href: '/admin/dimensions',
            countKey: 'dimensions',
          },
        ],
      },
    ],
  },
  {
    title: 'COMMUNITY',
    items: [
      {
        label: 'Users',
        href: '/admin/users',
        countKey: 'users',
        children: [{ label: 'Users', href: '/admin/users', countKey: 'users' }],
      },
      {
        label: 'Facilitators',
        href: '/admin/facilitators',
        countKey: 'facilitators',
        children: [
          {
            label: 'Facilitators',
            href: '/admin/facilitators',
            countKey: 'facilitators',
          },
        ],
      },
      {
        label: 'Teams',
        href: '/admin/teams',
        countKey: 'teams',
        children: [{ label: 'Teams', href: '/admin/teams', countKey: 'teams' }],
      },
      {
        label: 'Events',
        href: '/admin/events',
        countKey: 'events',
        badge: 3,
        children: [
          { label: 'Events', href: '/admin/events', countKey: 'events' },
        ],
      },
    ],
  },
  {
    title: 'BUSINESS',
    items: [
      {
        label: 'Bookings',
        href: '/admin/bookings',
        countKey: 'bookings',
        children: [
          { label: 'Bookings', href: '/admin/bookings', countKey: 'bookings' },
        ],
      },
      {
        label: 'Requests',
        href: '/admin/requests',
        countKey: 'requests',
        children: [
          { label: 'Requests', href: '/admin/requests', countKey: 'requests' },
        ],
      },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      {
        label: 'Settings',
        href: '/admin/settings',
        children: [{ label: 'Settings', href: '/admin/settings' }],
      },
      {
        label: 'Permissions',
        href: '/admin/permissions',
        children: [{ label: 'Permissions', href: '/admin/permissions' }],
      },
      {
        label: 'Log Out',
        href: '/sign-out',
        children: [],
      },
    ],
  },
];

const sectionItems = [...menuSection.flatMap(section => section.items)].sort(
  (a, b) => b.href.length - a.href.length
);

export const getMenuItem = (pathname: string) =>
  sectionItems.find(item =>
    item.href === '/admin'
      ? pathname === '/admin'
      : pathname.startsWith(item.href)
  );

export const topTabs: MenuItem[] = [
  { label: 'Corporate Teams ○', href: '#' },
  { label: 'Public Group ○', href: '#' },
  { label: 'Facilitators & Partners +', href: '#' },
];
