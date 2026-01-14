'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui';
import { Sparkles, User } from 'lucide-react';

interface HeaderProps {
  currentPage?: 'home' | 'pricing' | 'onboarding' | 'other';
}

export default function Header({ currentPage = 'other' }: HeaderProps) {
  const router = useRouter();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[var(--primary-foreground)]" />
            </div>
            <span className="text-lg font-semibold text-[var(--foreground)]">Tesseract Hub</span>
          </div>
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