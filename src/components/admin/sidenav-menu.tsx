'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/sidenav-menu.module.css';
import { getBadge } from '@/utils/menu-helper';
import { menuSection, BadgeCounts } from '@/types/menu-item';
import { menuIcons } from '@/constants/menu-icons';

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-5 h-5 flex items-center justify-center shrink-0">
      {children}
    </span>
  );
}

export default function Sidebar({
  badgeCounts,
  onNavigate,
  className = '',
}: {
  badgeCounts?: BadgeCounts;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <aside
      className={`w-56 shrink-0 bg-teal-deep text-white flex flex-col min-h-screen ${className}`}
    >
      {/* Logo */}
      <div className="px-4 h-14 flex items-center border-b border-white/10">
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
            <div className="text-[10px] text-white/60 leading-tight">
              Rediscover the Power of Play
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto py-3 px-2 ${styles.nav}`}>
        {menuSection.map(section => (
          <div key={section.title} className="mb-4">
            <p className=" text-white/40 font-bold px-2 mb-1 tracking-wider">
              {section.title}
            </p>
            {section.items.map(item => {
              const icon = menuIcons[item.href];
              const active = isActive(item.href);

              return (
                <div key={item.label}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs mb-0.5 transition-colors ${
                      active
                        ? 'bg-white/15 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {icon ? <NavIcon>{icon}</NavIcon> : null}
                    <span className="flex-1 truncate">{item.label}</span>
                    {(() => {
                      const badge = getBadge(item, badgeCounts);
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
                </div>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
