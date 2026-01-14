'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Settings Roles Page - Redirects to Staff Roles
 *
 * The actual Roles & Permissions management is handled at /staff/roles
 * which is connected to the real API. This page redirects there to avoid
 * confusion and duplicate functionality.
 */
export default function SettingsRolesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/staff/roles');
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Redirecting to Roles & Permissions...</p>
      </div>
    </div>
  );
}
