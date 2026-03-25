'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '@/styles/admin/sidenav-menu.module.css';
import type { RoleBranding } from '@/constants/role-branding';
import RoleLogo from '@/components/branding/role-logo';

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
  badgeCountClassName?: string;
};

export const adminStandardSidenavAppearance: AppSidenavAppearance = {
  navClassName: 'px-2 py-3',
  groupsClassName: '',
  groupClassName: 'mb-4',
  titleClassName:
    'text-white/40 font-bold px-2 mb-1 tracking-wider text-[10px]',
  itemClassName:
    'flex items-center gap-2 px-2 py-1.5 rounded-lg text-heading font-bold mb-0.5 transition-colors',
  itemActiveClassName: 'bg-white/15 text-white',
  itemInactiveClassName: 'text-white/70 hover:bg-white/10 hover:text-white',
  badgeClassName: 'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
  badgeLiveClassName: 'bg-magenta text-white',
  badgeCountClassName: 'bg-white/20 text-white',
};

function NavIcon({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-current">
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
  branding,
  surfaceClassName = 'bg-teal-deep',
  surfaceTextClassName = 'text-white',
  surfaceBorderClassName = 'border-white/10',
}: Readonly<{
  groups: AppSidenavGroup[];
  onNavigate?: () => void;
  className?: string;
  testId?: string;
  appearance?: AppSidenavAppearance;
  branding?: RoleBranding;
  surfaceClassName?: string;
  surfaceTextClassName?: string;
  surfaceBorderClassName?: string;
}>) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/admin' || href === '/dashboard'
      ? pathname === href
      : pathname.startsWith(href);

  function getBadgeClassName(item: AppSidenavItem) {
    const baseClassName =
      appearance?.badgeClassName ??
      'text-[10px] px-1.5 py-0.5 rounded-full font-bold';

    if (item.badgeVariant === 'live') {
      return [
        baseClassName,
        appearance?.badgeLiveClassName ?? 'bg-magenta text-white',
      ].join(' ');
    }

    return [
      baseClassName,
      appearance?.badgeCountClassName ?? 'bg-white/20 text-white',
    ].join(' ');
  }

  const logoBranding = branding ?? {
    role: 'role_user',
    dataRole: 'role_user',
    displayLabel: 'User',
    logoSrc: '/logo/logo-icon.png',
    logoAlt: 'Pop CoLab logo',
    footerLogoSrc: '/logo/user/logo-full-v.png',
    footerLogoAlt: 'Pop CoLab user footer logo',
  };

  return (
    <aside
      data-testid={testId}
      className={`flex min-h-screen w-56 shrink-0 flex-col ${surfaceTextClassName} ${surfaceClassName} ${className}`}
    >
      <div
        className={`flex h-16 items-center border-b px-4 sm:h-[4.5rem] ${surfaceBorderClassName}`}
      >
        <Link
          href="/"
          onClick={onNavigate}
          className="flex h-full items-center gap-2"
        >
          <RoleLogo
            branding={logoBranding}
            size={48}
            className="h-full w-auto object-contain"
          />
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
                          'flex items-center gap-2 px-2 py-1.5 rounded-lg text-heading font-bold transition-colors',
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
                      {item.badge === undefined ? null : (
                        <span className={getBadgeClassName(item)}>
                          {item.badge}
                        </span>
                      )}
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
