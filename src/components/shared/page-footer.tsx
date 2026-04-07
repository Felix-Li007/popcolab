'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { MenuItem } from '@/types/menu-item';
import {
  normalizeRole,
  readClaimRole,
  readMetaRole,
} from '@/utils/clerk-helper';
import type { RoleBranding } from '@/constants/role-branding';

const adminLinks: MenuItem[] = [
  { label: 'Dimensions', href: '/admin/dimensions' },
  { label: 'Personalities', href: '/admin/personalities' },
  { label: 'Questions', href: '/admin/questions' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Events', href: '/admin/events' },
  { label: 'Bookings', href: '/admin/bookings' },
];

const supportLinks: MenuItem[] = [
  { label: 'Help Centre', href: '#' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Use', href: '#' },
  { label: 'popcolab.ca ↗', href: 'https://popcolab.ca', external: true },
];

const dashboardLinks: MenuItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Personality', href: '/dashboard/personality' },
  { label: 'Experiences', href: '/dashboard/experiences' },
  { label: 'Events', href: '/dashboard/events' },
  { label: 'Teams', href: '/dashboard/teams' },
  { label: 'Requests', href: '/dashboard/requests' },
  { label: 'Bookings', href: '/dashboard/bookings' },
  { label: 'Profile', href: '/dashboard/profile' },
];

export default function PageFooter({
  branding,
}: Readonly<{ branding?: RoleBranding }>) {
  const pathname = usePathname();
  if (pathname.startsWith('/sign-in')) return null;
  return <PageFooterInner branding={branding} pathname={pathname} />;
}

function PageFooterInner({
  branding,
  pathname,
}: Readonly<{ branding?: RoleBranding; pathname: string }>) {
  const { isLoaded: isAuthLoaded, sessionClaims } = useAuth();
  const { isLoaded: isUserLoaded, user } = useUser();

  const claimRole = normalizeRole(readClaimRole(sessionClaims));
  const metadataRole = normalizeRole(
    readMetaRole(
      (user?.publicMetadata as Record<string, unknown> | undefined) ??
        (user?.unsafeMetadata as Record<string, unknown> | undefined) ??
        {}
    )
  );
  const role = claimRole ?? metadataRole;
  const isAdmin = isAuthLoaded && isUserLoaded && role === 'role_admin';
  const isDashboard = pathname.startsWith('/dashboard');
  const showDashboardLinks = isDashboard && !isAdmin;
  const footerBranding = branding ?? {
    role: 'role_user',
    dataRole: 'role_user',
    displayLabel: 'User',
    logoSrc: '/logo/logo-icon.png',
    logoAlt: 'Pop CoLab logo',
    footerLogoSrc: '/logo/user/logo-full-v.png',
    footerLogoAlt: 'Pop CoLab user footer logo',
  };
  const useThemeForeground = footerBranding.role === 'role_user';
  const footerText = useThemeForeground
    ? 'text-(--palette-foreground)'
    : 'text-(--palette-shell-foreground)';
  const footerTextSoft = useThemeForeground
    ? 'text-(--palette-foreground)/70'
    : 'text-(--palette-shell-foreground)/70';
  const footerTextMuted = useThemeForeground
    ? 'text-(--palette-foreground)/40'
    : 'text-(--palette-shell-foreground)/40';
  const footerTextSubtle = useThemeForeground
    ? 'text-(--palette-foreground)/60'
    : 'text-(--palette-shell-foreground)/60';
  const footerTextStrong = useThemeForeground
    ? 'text-(--palette-foreground)/90'
    : 'text-(--palette-shell-foreground)/90';
  const footerBorder = useThemeForeground
    ? 'border-(--palette-foreground)/10'
    : 'border-(--palette-shell-foreground)/10';
  const footerGridClassName =
    isAdmin || showDashboardLinks
      ? 'grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-5'
      : 'grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <footer className={`bg-(--palette-shell-background) ${footerText} mt-auto`}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className={footerGridClassName}>
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <Image
                src={footerBranding.footerLogoSrc}
                alt={footerBranding.footerLogoAlt}
                width={44}
                height={44}
                className="shrink-0 object-contain"
              />
            </Link>
            <p className={`${footerTextSubtle} text-xs leading-relaxed`}>
              Rediscover the Power of Play.
              <br />
              Building trust one experience at a time.
            </p>
            <Image
              src="/images/doodle.png"
              alt="Pop CoLab illustration"
              width={148}
              height={148}
              className="mt-4 rounded-xl object-cover"
            />
          </div>

          {/* Admin links: visible only for signed-in admin users */}
          {isAdmin ? (
            <div>
              <h4
                className={`text-xs font-bold uppercase tracking-wider ${footerTextMuted} mb-3`}
              >
                Admin
              </h4>
              <ul className="space-y-1.5">
                {adminLinks.map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className={`text-heading font-bold ${footerTextSoft} hover:${footerText} transition-colors`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {showDashboardLinks ? (
            <div>
              <h4
                className={`text-xs font-bold uppercase tracking-wider ${footerTextMuted} mb-3`}
              >
                Dashboard
              </h4>
              <ul className="space-y-1.5">
                {dashboardLinks.map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className={`text-heading font-bold ${footerTextSoft} hover:${footerText} transition-colors`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Support links */}
          <div>
            <h4
              className={`text-xs font-bold uppercase tracking-wider ${footerTextMuted} mb-3`}
            >
              Support
            </h4>
            <ul className="space-y-1.5">
              {supportLinks.map(link => (
                <li key={link.label}>
                  {link.href === '#' ? (
                    <button
                      type="button"
                      className={`bg-transparent border-0 p-0 text-heading font-bold ${footerTextSoft} hover:${footerText} transition-colors`}
                    >
                      {link.label}
                    </button>
                  ) : (
                    <a
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      className={`text-heading font-bold ${footerTextSoft} hover:${footerText} transition-colors`}
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4
              className={`text-xs font-bold uppercase tracking-wider ${footerTextMuted} mb-3`}
            >
              Where to Find Us
            </h4>
            <div className={`space-y-3 text-xs ${footerTextSoft}`}>
              <div>
                <p className={`font-semibold ${footerTextStrong} mb-0.5`}>
                  Location
                </p>
                <p>R4 – 1 Lombard Ave.</p>
                <p>Winnipeg, MB R3B 0X8</p>
                <p>Richardson Centre Concourse</p>
                <p
                  className={
                    useThemeForeground
                      ? 'text-(--palette-foreground)/50'
                      : 'text-(--palette-shell-foreground)/50'
                  }
                >
                  (Lower Level)
                </p>
              </div>
              <div>
                <p className={`font-semibold ${footerTextStrong} mb-0.5`}>
                  Hours
                </p>
                <p>Mon – Fri: 9am – 6pm</p>
                <p>Sat: 10am – 4pm</p>
                <p>Sun: Closed</p>
              </div>
              <div>
                <p className={`font-semibold ${footerTextStrong} mb-0.5`}>
                  Contact
                </p>
                <a
                  href="mailto:hello@popcolab.ca"
                  className={`hover:${footerText} transition-colors`}
                >
                  hello@popcolab.ca
                </a>
                <br />
                <a
                  href="mailto:xxx@pop.colab"
                  className={`hover:${footerText} transition-colors`}
                >
                  xxx@pop.colab
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={`border-t ${footerBorder} px-6 py-3`}>
        <div
          className={`max-w-7xl mx-auto flex items-center justify-between text-[10px] ${footerTextMuted}`}
        >
          <span>©2026 Pop CoLab</span>
          <div className="flex gap-3">
            <button
              type="button"
              className={`bg-transparent border-0 p-0 font-bold ${useThemeForeground ? 'hover:text-(--palette-foreground)/70' : 'hover:text-(--palette-shell-foreground)/70'} transition-colors`}
            >
              Privacy
            </button>
            <button
              type="button"
              className={`bg-transparent border-0 p-0 font-bold ${useThemeForeground ? 'hover:text-(--palette-foreground)/70' : 'hover:text-(--palette-shell-foreground)/70'} transition-colors`}
            >
              Terms
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
