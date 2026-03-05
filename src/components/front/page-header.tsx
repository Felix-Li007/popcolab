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

export default function Header({
  userDisplayName,
  userRoleLabel,
  initialCompany,
}: {
  userDisplayName?: string;
  userRoleLabel?: string;
  initialCompany?: CompanyInfo | null;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  if (pathname.startsWith('/sign-in')) {
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
          <Link href="/" className={styles.navLink}>
            Home
          </Link>
          <Link href="/about" className={styles.navLink}>
            About
          </Link>
          <Link href="/services" className={styles.navLink}>
            Services
          </Link>
          <Link href="/contact" className={styles.navLink}>
            Contact
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className={styles.authButtons}>
          <SignedOut>
            <SignInButton>
              <button className={styles.signinBtn}>Sign In</button>
            </SignInButton>
            <SignUpButton>
              <button className={styles.signupBtn}>Sign Up</button>
            </SignUpButton>
          </SignedOut>
          <UserAvatar
            displayName={userDisplayName}
            roleLabel={userRoleLabel}
            initialCompany={initialCompany}
          />
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className={styles.menuBtn}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          aria-controls="mobile-nav"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>

        {/* Mobile Navigation */}
        <nav
          id="mobile-nav"
          className={`${styles.navMobile} ${isOpen ? styles.open : ''}`}
        >
          <Link href="/" className={styles.navLink} onClick={closeMenu}>
            Home
          </Link>
          <Link href="/about" className={styles.navLink} onClick={closeMenu}>
            About
          </Link>
          <Link href="/services" className={styles.navLink} onClick={closeMenu}>
            Services
          </Link>
          <Link href="/contact" className={styles.navLink} onClick={closeMenu}>
            Contact
          </Link>

          <div className={styles.mobileAuthBlock}>
            <SignedOut>
              <SignInButton>
                <button className={styles.signinBtn}>Sign In</button>
              </SignInButton>
              <SignUpButton>
                <button className={`${styles.signupBtn} ${styles.fullWidth}`}>
                  Sign Up
                </button>
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
