'use client';

import React from 'react';
import { AdminPageTitle } from '@/components/translation/AdminTranslatedText';

export function DashboardToolbar() {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-foreground">
        <AdminPageTitle text="Dashboard" as="span" />
      </h1>
    </div>
  );
}
