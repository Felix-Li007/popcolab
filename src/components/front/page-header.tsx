'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';
import '@/styles/page-Header.css';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="header-container">
      <div className="header-wrapper">
        <Link href="/" className="logo">
          <img
            src="/logo/logo-icon.png" // path from public folder
            alt="PopColab Logo"
            className="logo-img"
          />
          <span>PopColab</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-desktop">
          <Link href="/" className="nav-link">
            Home
          </Link>
          <Link href="/" className="nav-link">
            About
          </Link>
          <Link href="/" className="nav-link">
            Services
          </Link>
          <Link href="/" className="nav-link">
            Contact
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="auth-buttons">
          <SignedOut>
            <SignInButton>
              <button className="signin-btn">Sign In</button>
            </SignInButton>
            <SignUpButton>
              <button className="signup-btn">Sign Up</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="menu-btn"
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
      <nav className={`nav-mobile ${isOpen ? 'open' : ''}`}>
        <Link href="/" className="nav-link">
          Home
        </Link>
        <Link href="/" className="nav-link">
          About
        </Link>
        <Link href="/" className="nav-link">
          Services
        </Link>
        <Link href="/" className="nav-link">
          Contact
        </Link>

        <div
          style={{
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <SignedOut>
            <SignInButton>
              <button className="signin-btn">Sign In</button>
            </SignInButton>
            <SignUpButton>
              <button className="signup-btn" style={{ width: '100%' }}>
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}
