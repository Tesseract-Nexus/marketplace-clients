'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Settings Index Page
 * Redirects to the General Settings page by default
 */
export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings/general');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="text-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to settings...</p>
      </div>
    </div>
  );
}
