'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

const AVATAR_CACHE_KEY = 'customer-avatar';

interface CustomerAvatarProps {
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  className?: string;
  fallbackTextClass?: string;
  fallbackBgClass?: string;
  fallbackTextColorClass?: string;
  fallbackStyle?: React.CSSProperties;
}

export function CustomerAvatar({
  avatarUrl,
  firstName,
  lastName,
  className,
  fallbackTextClass,
  fallbackBgClass = 'bg-tenant-primary',
  fallbackTextColorClass = 'text-on-tenant-primary',
  fallbackStyle,
}: CustomerAvatarProps) {
  const customer = useAuthStore((state) => state.customer);
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);

  const resolvedUrl = avatarUrl ?? customer?.avatarUrl;
  const resolvedFirst = firstName ?? customer?.firstName;
  const resolvedLast = lastName ?? customer?.lastName;

  // On mount, read cached avatar URL from localStorage for instant display
  useEffect(() => {
    if (!resolvedUrl && customer?.id) {
      try {
        const cached = localStorage.getItem(`${AVATAR_CACHE_KEY}-${customer.id}`);
        if (cached) setCachedUrl(cached);
      } catch {}
    }
  }, [customer?.id, resolvedUrl]);

  // When avatarUrl is available from the store, cache it in localStorage
  useEffect(() => {
    if (resolvedUrl && customer?.id) {
      try {
        localStorage.setItem(`${AVATAR_CACHE_KEY}-${customer.id}`, resolvedUrl);
      } catch {}
      setCachedUrl(null); // no longer needed, store has the real value
    }
  }, [resolvedUrl, customer?.id]);

  const displayUrl = resolvedUrl || cachedUrl;

  const initials =
    `${resolvedFirst?.[0] || ''}${resolvedLast?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <Avatar className={className}>
      {displayUrl && <AvatarImage src={displayUrl} alt={`${resolvedFirst || ''} ${resolvedLast || ''}`} />}
      <AvatarFallback
        className={cn(fallbackBgClass, fallbackTextColorClass, fallbackTextClass)}
        style={fallbackStyle}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
