'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-[#19464d] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold">
            PopColab
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-8">
            <Link href="/">Home</Link>
            <Link href="/">About</Link>
            <Link href="/">Services</Link>
            <Link href="/">Contact</Link>
          </nav>

          {/* Mobile Button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <nav className="md:hidden mt-4 flex flex-col gap-3">
            <Link href="/">Home</Link>
            <Link href="/">About</Link>
            <Link href="/">Services</Link>
            <Link href="/">Contact</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
