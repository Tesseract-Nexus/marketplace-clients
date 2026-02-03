'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { Sparkles, User } from 'lucide-react';

interface HeaderProps {
  currentPage?: 'home' | 'pricing' | 'onboarding' | 'other';
}

export default function Header({ currentPage = 'other' }: HeaderProps) {
  const router = useRouter();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img
              src="/logo.png"
              alt="Mark8ly"
              className="h-10 w-auto"
            />
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <a 
              href="/" 
              className={`${
                currentPage === 'home' 
                  ? 'text-[var(--foreground)] font-medium' 
                  : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
              } transition-colors`}
            >
              Home
            </a>
            <a 
              href="/pricing" 
              className={`${
                currentPage === 'pricing' 
                  ? 'text-[var(--foreground)] font-medium' 
                  : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
              } transition-colors`}
            >
              Pricing
            </a>
            <Button size="sm" onClick={() => router.push('/onboarding')}>
              Get Started
            </Button>
            <div className="h-6 w-px bg-[var(--border)]" />
            <Button variant="ghost" size="sm" className="flex items-center gap-2 whitespace-nowrap">
              <User className="w-4 h-4" />
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
