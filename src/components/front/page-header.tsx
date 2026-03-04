'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs';
import styles from '@/styles/page-header.module.css';
import UserAvatar from '@/components/shared/user-avatar';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

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
          <UserAvatar />
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className={styles.menuBtn}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      <nav className={`${styles.navMobile} ${isOpen ? styles.open : ''}`}>
        <Link href="/" className={styles.navLink}>
          Home
        </Link>
        <Link href="/" className={styles.navLink}>
          About
        </Link>
        <Link href="/" className={styles.navLink}>
          Services
        </Link>
        <Link href="/" className={styles.navLink}>
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
          <UserAvatar />
        </div>
      </nav>
    </header>
  );
}
