
'use client';

import React from 'react';
import { Building2, User, MapPin, Settings, Rocket, BarChart, Zap } from 'lucide-react';

interface OnboardingBrandingProps {
  currentStep: number;
}

const steps = [
  {
    icon: Rocket,
    title: 'Launch Your Business into the Future',
    description: 'Mark8ly provides the ultimate platform to build, manage, and scale your online business with ease.',
  },
  {
    icon: Zap,
    title: 'Connect with Your Customers, Instantly',
    description: 'Engage your audience with powerful tools and build lasting relationships that drive growth.',
  },
  {
    icon: BarChart,
    title: 'Grow Your Business to New Heights',
    description: 'Unlock your potential with our scalable and robust e-commerce solutions.',
  },
  {
    icon: Settings,
    title: 'Customize Your Store, Your Way',
    description: 'Tailor your online store to perfectly match your brand and start selling in minutes.',
  },
];

export function OnboardingBranding({ currentStep }: OnboardingBrandingProps) {
  const safeStep = Math.min(Math.max(0, currentStep), steps.length - 1);
  const { icon: Icon, title, description } = steps[safeStep]!;

  return (
    <div className="flex flex-col items-center justify-center text-center text-foreground p-12">
      <div className="w-32 h-32 bg-warm-100 rounded-3xl flex items-center justify-center shadow-sm mb-8">
        <Icon className="w-16 h-16 text-foreground-secondary" />
      </div>
      <h2 className="display-small mb-4">{title}</h2>
      <p className="body-large max-w-sm text-foreground-secondary">{description}</p>
    </div>
  );
}
