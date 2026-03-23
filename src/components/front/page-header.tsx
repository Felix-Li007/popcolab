'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs';
import styles from '@/styles/page-header.module.css';
import UserAvatar from '@/components/shared/user-avatar';
import type { CompanyInfo } from '@/types/company-type';
import { Button } from '@/ui';

export default function Header({
  userDisplayName,
  userRoleLabel,
  initialCompany,
}: Readonly<{
  userDisplayName?: string;
  userRoleLabel?: string;
  initialCompany?: CompanyInfo | null;
}>) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  if (
    pathname.startsWith(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL as string) ||
    pathname.startsWith(process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL as string)
  ) {
    return null;
  }

  return (
    <header className={styles.headerContainer}>
      <div className={styles.headerWrapper}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/logo/logo-icon.png"
            alt="Pop CoLab"
            width={32}
            height={32}
            className="rounded-full"
          />
          <span>PopColab</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.navDesktop}>
          <Link
            href="/"
            className={`${styles.navLink} ${isActive('/') ? styles.navLinkActive : ''}`}
          >
            Home
          </Link>

          <Link
            href="/services"
            className={`${styles.navLink} ${isActive('/services') ? styles.navLinkActive : ''}`}
          >
            Services
          </Link>
          <Link
            href="/contact"
            className={`${styles.navLink} ${isActive('/contact') ? styles.navLinkActive : ''}`}
          >
            Contact
          </Link>
          <Link
            href="/about"
            className={`${styles.navLink} ${isActive('/about') ? styles.navLinkActive : ''}`}
          >
            About
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className={styles.authButtons}>
          <SignedOut>
            <SignInButton>
              <Button
                className={`${styles.signinBtn} `}
                variant="text"
                size="md"
              >
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button
                className={`${styles.signupBtn}`}
                variant="text"
                size="md"
              >
                Join Now
              </Button>
            </SignUpButton>
          </SignedOut>
          <UserAvatar
            displayName={userDisplayName}
            roleLabel={userRoleLabel}
            initialCompany={initialCompany}
          />
        </div>

        {/* Mobile Menu Toggle */}
        <Button
          type="button"
          variant="text"
          size="xs"
          className={styles.menuBtn}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          aria-controls="mobile-nav"
          aria-expanded={isOpen ? 'true' : 'false'}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </Button>

        {/* Mobile Navigation */}
        <nav
          id="mobile-nav"
          className={`${styles.navMobile} ${isOpen ? styles.open : ''}`}
        >
          <Link
            href="/"
            className={`${styles.navLink} ${isActive('/') ? styles.navLinkActive : ''}`}
            onClick={closeMenu}
          >
            Home
          </Link>
          <Link
            href="/services"
            className={`${styles.navLink} ${isActive('/services') ? styles.navLinkActive : ''}`}
            onClick={closeMenu}
          >
            Services
          </Link>
          <Link
            href="/contact"
            className={`${styles.navLink} ${isActive('/contact') ? styles.navLinkActive : ''}`}
            onClick={closeMenu}
          >
            Contact
          </Link>
          <Link
            href="/about"
            className={`${styles.navLink} ${isActive('/about') ? styles.navLinkActive : ''}`}
            onClick={closeMenu}
          >
            About
          </Link>
          <div className={styles.mobileAuthBlock}>
            <SignedOut>
              <SignInButton>
                <Button
                  className={`${styles.signinBtn}`}
                  variant="text"
                  size="xs"
                >
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button
                  className={`${styles.signupBtn} ${styles.fullWidth}`}
                  variant="text"
                  size="xs"
                >
                  Join Now
                </Button>
              </SignUpButton>
            </SignedOut>
            <UserAvatar
              displayName={userDisplayName}
              roleLabel={userRoleLabel}
              initialCompany={initialCompany}
            />
          </div>
        </nav>
      </div>
    </header>
  );
}
