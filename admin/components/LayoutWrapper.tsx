'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface LayoutWrapperProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header: (setSidebarOpen: (open: boolean) => void) => React.ReactNode;
}

export function LayoutWrapper({ children, sidebar, header }: LayoutWrapperProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Public pages that don't need sidebar/header
  const publicPages = ['/login', '/welcome'];
  const isPublicPage = publicPages.includes(pathname || '');

  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      {sidebar}
      <div className="lg:ml-72">
        {header(setSidebarOpen)}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
