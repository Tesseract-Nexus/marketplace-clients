'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/context/TenantContext';
import { cn } from '@/lib/utils';

const COOKIE_CONSENT_KEY = 'cookie-consent';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

export function CookieConsentBanner() {
  const { settings } = useTenant();
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    timestamp: '',
  });

  // Check if cookie banner should be shown
  const shouldShowBanner = settings.advancedConfig?.visibility?.showCookieBanner ?? false;

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined' || !shouldShowBanner) return;

    // Check if user has already consented
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CookiePreferences;
        setPreferences(parsed);
        setShowBanner(false);
      } catch {
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }
  }, [shouldShowBanner]);

  const handleAcceptAll = () => {
    const newPreferences: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    savePreferences(newPreferences);
  };

  const handleAcceptNecessary = () => {
    const newPreferences: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    savePreferences(newPreferences);
  };

  const handleSavePreferences = () => {
    const newPreferences = {
      ...preferences,
      timestamp: new Date().toISOString(),
    };
    savePreferences(newPreferences);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    setShowPreferences(false);

    // Dispatch event for analytics providers to react
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: prefs }));
  };

  // Don't render if banner shouldn't be shown or user has consented
  if (!shouldShowBanner || !showBanner) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-[var(--z-modal)] p-4 md:p-6"
      >
        <div className="mx-auto max-w-4xl">
          <div className="bg-background/95 backdrop-blur-lg border border-border rounded-2xl shadow-2xl p-4 md:p-6">
            {showPreferences ? (
              <PreferencesPanel
                preferences={preferences}
                setPreferences={setPreferences}
                onSave={handleSavePreferences}
                onCancel={() => setShowPreferences(false)}
              />
            ) : (
              <MainBanner
                onAcceptAll={handleAcceptAll}
                onAcceptNecessary={handleAcceptNecessary}
                onCustomize={() => setShowPreferences(true)}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

interface MainBannerProps {
  onAcceptAll: () => void;
  onAcceptNecessary: () => void;
  onCustomize: () => void;
}

function MainBanner({ onAcceptAll, onAcceptNecessary, onCustomize }: MainBannerProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex items-start gap-3 flex-1">
        <div className="hidden sm:flex h-10 w-10 shrink-0 rounded-full bg-primary/10 items-center justify-center">
          <Cookie className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">We value your privacy</h3>
          <p className="text-sm text-muted-foreground">
            We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic.
            By clicking "Accept All", you consent to our use of cookies.
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onCustomize}
          className="order-3 sm:order-1"
        >
          <Settings className="h-4 w-4 mr-2" />
          Customize
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onAcceptNecessary}
          className="order-2"
        >
          Necessary Only
        </Button>
        <Button
          variant="tenant-primary"
          size="sm"
          onClick={onAcceptAll}
          className="order-1 sm:order-3"
        >
          <Check className="h-4 w-4 mr-2" />
          Accept All
        </Button>
      </div>
    </div>
  );
}

interface PreferencesPanelProps {
  preferences: CookiePreferences;
  setPreferences: React.Dispatch<React.SetStateAction<CookiePreferences>>;
  onSave: () => void;
  onCancel: () => void;
}

function PreferencesPanel({ preferences, setPreferences, onSave, onCancel }: PreferencesPanelProps) {
  const cookieTypes = [
    {
      id: 'necessary',
      name: 'Necessary',
      description: 'Essential cookies for the website to function properly. These cannot be disabled.',
      required: true,
    },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'Help us understand how visitors interact with our website by collecting anonymous data.',
      required: false,
    },
    {
      id: 'marketing',
      name: 'Marketing',
      description: 'Used to deliver personalized advertisements and track ad campaign performance.',
      required: false,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Cookie Preferences</h3>
        <button
          onClick={onCancel}
          className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3 mb-4">
        {cookieTypes.map((type) => (
          <div
            key={type.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="flex-1 mr-4">
              <p className="font-medium text-sm">{type.name}</p>
              <p className="text-xs text-muted-foreground">{type.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences[type.id as keyof CookiePreferences] as boolean}
                disabled={type.required}
                onChange={(e) => {
                  if (!type.required) {
                    setPreferences((prev) => ({
                      ...prev,
                      [type.id]: e.target.checked,
                    }));
                  }
                }}
              />
              <div
                className={cn(
                  "w-11 h-6 rounded-full peer",
                  "peer-focus:ring-2 peer-focus:ring-primary/20",
                  "after:content-[''] after:absolute after:top-0.5 after:left-[2px]",
                  "after:bg-white after:rounded-full after:h-5 after:w-5",
                  "after:transition-all",
                  "peer-checked:after:translate-x-full",
                  preferences[type.id as keyof CookiePreferences]
                    ? "bg-primary"
                    : "bg-muted-foreground/30",
                  type.required && "opacity-60 cursor-not-allowed"
                )}
              />
            </label>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="tenant-primary" size="sm" onClick={onSave}>
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

export default CookieConsentBanner;
