'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from '@/styles/admin/sidenav-menu.module.css';

export type AppSidenavItem = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'live' | 'count';
};

export type AppSidenavGroup = {
  title: string;
  items: AppSidenavItem[];
};

type AppSidenavAppearance = {
  navClassName?: string;
  groupsClassName?: string;
  groupClassName?: string;
  titleClassName?: string;
  itemClassName?: string;
  itemActiveClassName?: string;
  itemInactiveClassName?: string;
  badgeClassName?: string;
  badgeLiveClassName?: string;
};

export const adminStandardSidenavAppearance: AppSidenavAppearance = {
  navClassName: 'px-2 py-3',
  groupsClassName: '',
  groupClassName: 'mb-4',
  titleClassName:
    'text-white/40 font-bold px-2 mb-1 tracking-wider text-[10px]',
  itemClassName:
    'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs mb-0.5 transition-colors',
  itemActiveClassName: 'bg-white/15 text-white',
  itemInactiveClassName: 'text-white/70 hover:bg-white/10 hover:text-white',
  badgeClassName: 'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
  badgeLiveClassName: 'bg-magenta text-white',
};

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-white/90">
      {children}
    </span>
  );
}

export default function AppSidenav({
  groups,
  onNavigate,
  className = '',
  testId,
  appearance,
}: {
  groups: AppSidenavGroup[];
  onNavigate?: () => void;
  className?: string;
  testId?: string;
  appearance?: AppSidenavAppearance;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/admin' || href === '/dashboard'
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <aside
      data-testid={testId}
      className={`flex min-h-screen w-56 shrink-0 flex-col bg-teal-deep text-white ${className}`}
    >
      <div className="flex h-14 items-center border-b border-white/10 px-4">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-2">
          <Image
            src="/logo/logo-icon.png"
            alt="Pop CoLab"
            width={32}
            height={32}
            className="rounded-full"
          />
          <div>
            <div className="text-heading font-bold leading-tight">
              Pop CoLab
            </div>
            <div className="text-[10px] leading-tight text-white/60">
              Rediscover the Power of Play
            </div>
          </div>
        </Link>
      </div>

      <nav
        className={`flex-1 overflow-y-auto px-2 py-3 ${styles.nav} ${appearance?.navClassName ?? ''}`}
      >
        <div className={appearance?.groupsClassName ?? 'space-y-4'}>
          {groups.map(group => (
            <div
              key={group.title}
              className={appearance?.groupClassName ?? 'mb-4'}
            >
              <p
                className={
                  appearance?.titleClassName ??
                  'px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-white/40'
                }
              >
                {group.title}
              </p>

              <div className="space-y-0.5">
                {group.items.map(item => {
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={[
                        appearance?.itemClassName ??
                          'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors',
                        active
                          ? (appearance?.itemActiveClassName ??
                            'bg-white/15 text-white')
                          : (appearance?.itemInactiveClassName ??
                            'text-white/70 hover:bg-white/10 hover:text-white'),
                      ].join(' ')}
                    >
                      {item.icon ? <NavIcon>{item.icon}</NavIcon> : null}
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                      {item.badge !== undefined ? (
                        <span
                          className={[
                            appearance?.badgeClassName ??
                              'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                            item.badgeVariant === 'live'
                              ? (appearance?.badgeLiveClassName ??
                                'bg-magenta text-white')
                              : 'bg-white/20 text-white',
                          ].join(' ')}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}
