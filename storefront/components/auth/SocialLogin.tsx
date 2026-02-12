'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Apple } from 'lucide-react';

interface SocialLoginProps {
  onLogin: (provider: string) => void;
  isLoading?: boolean;
  mode?: 'login' | 'register';
  enabledProviders?: ('google' | 'apple' | 'facebook' | 'instagram')[];
}

// Google Icon
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// Facebook Icon
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

// Instagram Icon (gradient version)
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <defs>
      <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFDC80"/>
        <stop offset="25%" stopColor="#FCAF45"/>
        <stop offset="50%" stopColor="#F77737"/>
        <stop offset="75%" stopColor="#F56040"/>
        <stop offset="100%" stopColor="#FD1D1D"/>
      </linearGradient>
      <linearGradient id="instagram-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#833AB4"/>
        <stop offset="50%" stopColor="#C13584"/>
        <stop offset="100%" stopColor="#E1306C"/>
      </linearGradient>
    </defs>
    <path fill="url(#instagram-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
    <path fill="url(#instagram-gradient-2)" d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8z"/>
    <circle fill="url(#instagram-gradient)" cx="18.406" cy="5.594" r="1.44"/>
  </svg>
);

// All available providers - the order here determines display order
const allProviders = [
  {
    id: 'google',
    name: 'Google',
    icon: GoogleIcon,
    bgColor: 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700',
    textColor: 'text-gray-700 dark:text-gray-200',
    borderColor: 'border-gray-300 dark:border-gray-600',
  },
  {
    id: 'apple',
    name: 'Apple',
    icon: Apple,
    bgColor: 'bg-black hover:bg-gray-900',
    textColor: 'text-white',
    borderColor: 'border-black',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: FacebookIcon,
    bgColor: 'bg-[#1877F2] hover:bg-[#166FE5]',
    textColor: 'text-white',
    borderColor: 'border-[#1877F2]',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: InstagramIcon,
    bgColor: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 hover:from-yellow-500 hover:via-red-600 hover:to-purple-700',
    textColor: 'text-white',
    borderColor: 'border-transparent',
  },
];

// Default providers if not specified
const defaultProviders: ('google' | 'apple' | 'facebook' | 'instagram')[] = ['google', 'facebook'];

export function SocialLogin({
  onLogin,
  isLoading = false,
  mode = 'login',
  enabledProviders = defaultProviders,
}: SocialLoginProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  // Filter providers based on enabledProviders prop
  const providers = allProviders.filter((p) =>
    enabledProviders.includes(p.id as 'google' | 'apple' | 'facebook' | 'instagram')
  );

  const handleProviderClick = async (providerId: string) => {
    setLoadingProvider(providerId);
    try {
      await onLogin(providerId);
    } finally {
      setLoadingProvider(null);
    }
  };

  // If no providers enabled, don't render anything
  if (providers.length === 0) {
    return null;
  }

  // Determine grid columns based on number of providers
  const gridCols = providers.length === 4 ? 'grid-cols-4' :
                   providers.length === 3 ? 'grid-cols-3' :
                   providers.length === 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div className="space-y-4">
      <div className="relative">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider">
          or continue with
        </span>
      </div>

      <div className={`grid ${gridCols} gap-3`}>
        {providers.map((provider) => {
          const Icon = provider.icon;
          const isProviderLoading = loadingProvider === provider.id;

          return (
            <Button
              key={provider.id}
              variant="outline"
              className={`relative h-12 ${provider.bgColor} ${provider.textColor} ${provider.borderColor} transition-all duration-200 hover:scale-[1.02]`}
              onClick={() => handleProviderClick(provider.id)}
              disabled={isLoading || loadingProvider !== null}
              title={`${mode === 'login' ? 'Sign in' : 'Sign up'} with ${provider.name}`}
            >
              {isProviderLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon className="h-6 w-6" />
              )}
              <span className="sr-only">{mode === 'login' ? 'Sign in' : 'Sign up'} with {provider.name}</span>
            </Button>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}
