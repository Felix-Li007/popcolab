'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/sidebar.module.css';

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'live' | 'count';
};

type NavSection = {
  title: string;
  items: NavItem[];
};

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-5 h-5 flex items-center justify-center shrink-0">
      {children}
    </span>
  );
}

const navSections: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        icon: (
          <NavIcon>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M3 4a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm7 0a1 1 0 011-1h5a1 1 0 011 1v2a1 1 0 01-1 1h-5a1 1 0 01-1-1V4zM3 12a1 1 0 011-1h5a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zm7-1a1 1 0 011-1h5a1 1 0 011 1v6a1 1 0 01-1 1h-5a1 1 0 01-1-1v-6z" />
            </svg>
          </NavIcon>
        ),
      },
    ],
  },
  {
    title: 'PLAY CONTENT',
    items: [
      {
        label: 'Personalities',
        href: '/admin/personalities',
        icon: (
          <NavIcon>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </NavIcon>
        ),
      },
      {
        label: 'Surveys',
        href: '/admin/surveys',
        badge: 12,
        icon: (
          <NavIcon>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </NavIcon>
        ),
      },
      {
        label: 'Experiences',
        href: '/admin/experiences',
        badge: '50+',
        icon: (
          <NavIcon>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </NavIcon>
        ),
      },
    ],
  },
  {
    title: 'COMMUNITY',
    items: [
      {
        label: 'Users',
        href: '/admin/users',
        icon: (
          <NavIcon>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zm8 0a3 3 0 11-6 0 3 3 0 016 0zM.458 18C.372 17.553.25 17.013.25 16.5 .25 14.015 4.418 12 9.5 12s9.25 2.015 9.25 4.5c0 .513-.122 1.053-.208 1.5H.458z" />
            </svg>
          </NavIcon>
        ),
      },
      {
        label: 'Facilitators',
        href: '/admin/facilitators',
        icon: (
          <NavIcon>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </NavIcon>
        ),
      },
      {
        label: 'Teams',
        href: '/admin/teams',
        icon: (
          <NavIcon>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </NavIcon>
        ),
      },
      {
        label: 'Events',
        href: '/admin/events',
        badge: 3,
        icon: (
          <NavIcon>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
          </NavIcon>
        ),
      },
    ],
  },
  {
    title: 'BUSINESS',
    items: [
      {
        label: 'Bookings',
        href: '/admin/bookings',
        icon: (
          <NavIcon>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                clipRule="evenodd"
              />
            </svg>
          </NavIcon>
        ),
      },
      {
        label: 'Requests',
        href: '/admin/requests',
        badge: 5,
        icon: (
          <NavIcon>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
          </NavIcon>
        ),
      },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      {
        label: 'Settings',
        href: '/admin/settings',
        icon: (
          <NavIcon>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
          </NavIcon>
        ),
      },
      {
        label: 'Permissions',
        href: '/admin/permissions',
        icon: (
          <NavIcon>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
          </NavIcon>
        ),
      },
      {
        label: 'Log Out',
        href: '/sign-out',
        icon: (
          <NavIcon>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                clipRule="evenodd"
              />
            </svg>
          </NavIcon>
        ),
      },
    ],
  },
];

export default function Sidebar({
  personalitiesCount,
}: {
  personalitiesCount?: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-teal-deep text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-4 h-14 flex items-center border-b border-white/10">
        <div className="flex items-center gap-2">
          <Image
            src="/logo/logo-icon.png"
            alt="Pop CoLab"
            width={32}
            height={32}
            className="rounded-full"
          />
          <div>
            <div className="text-sm font-bold leading-tight">Pop CoLab</div>
            <div className="text-[10px] text-white/60 leading-tight">
              Rediscover the Power of Play
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto py-3 px-2 ${styles.nav}`}>
        {navSections.map(section => (
          <div key={section.title} className="mb-4">
            <p className="text-[10px] text-white/40 font-bold px-2 mb-1 tracking-wider">
              {section.title}
            </p>
            {section.items.map(item => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs mb-0.5 transition-colors ${
                  (
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(item.href)
                  )
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="flex-1 truncate">{item.label}</span>
                {(() => {
                  const badge =
                    item.label === 'Personalities'
                      ? (personalitiesCount ?? item.badge)
                      : item.badge;
                  return badge !== undefined ? (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        item.badgeVariant === 'live'
                          ? 'bg-magenta text-white'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {badge}
                    </span>
                  ) : null;
                })()}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
