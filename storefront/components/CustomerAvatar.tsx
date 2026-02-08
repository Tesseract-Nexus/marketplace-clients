'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

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

  const resolvedUrl = avatarUrl ?? customer?.avatarUrl;
  const resolvedFirst = firstName ?? customer?.firstName;
  const resolvedLast = lastName ?? customer?.lastName;

  const initials =
    `${resolvedFirst?.[0] || ''}${resolvedLast?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <Avatar className={className}>
      {resolvedUrl && <AvatarImage src={resolvedUrl} alt={`${resolvedFirst || ''} ${resolvedLast || ''}`} />}
      <AvatarFallback
        className={cn(fallbackBgClass, fallbackTextColorClass, fallbackTextClass)}
        style={fallbackStyle}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
