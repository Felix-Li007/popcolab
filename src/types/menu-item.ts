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
  | 'forms'
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
          {
            label: 'Forms',
            href: '/admin/questions/forms',
            countKey: 'forms',
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
          {
            label: 'Categories',
            href: '/admin/dimensions/categories',
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
        children: [
          {
            label: 'Users',
            href: '/admin/users',
            countKey: 'users',
          },
          {
            label: 'Teams',
            href: '/admin/users/teams',
            countKey: 'teams',
          },
        ],
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
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact' },
];
