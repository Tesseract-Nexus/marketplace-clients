'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface SocialLoginProps {
  onLogin: (provider: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

/**
 * Social login buttons for Keycloak identity providers.
 * Only shows providers that are configured in Keycloak.
 */
export function SocialLogin({ onLogin, isLoading = false, disabled = false }: SocialLoginProps) {
  // Only show Google since that's what's configured in Keycloak
  // Add more providers here as they're configured in Keycloak
  const providers = [
    {
      id: 'google',
      name: 'Google',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      ),
      bgColor: 'bg-white hover:bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300',
      label: 'Continue with Google',
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {providers.map((provider) => (
        <button
          key={provider.id}
          type="button"
          onClick={() => onLogin(provider.id)}
          disabled={isLoading || disabled}
          className={`flex items-center justify-center gap-3 w-full h-11 rounded-lg ${provider.bgColor} ${provider.textColor} border ${provider.borderColor} shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-medium text-sm`}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {provider.icon}
              <span>{provider.label}</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}
