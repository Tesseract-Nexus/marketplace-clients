'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface MethodCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (checked: boolean) => void;
  disabled?: boolean;
}

export function MethodCard({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
  disabled,
}: MethodCardProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onToggle(!enabled)}
      disabled={disabled}
      className={cn(
        "p-4 rounded-xl border-2 transition-all text-left group hover:shadow-md w-full",
        enabled
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-border/60",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
          enabled ? "bg-primary/10" : "bg-muted group-hover:bg-muted/80"
        )}>
          <Icon className={cn(
            "h-4.5 w-4.5",
            enabled ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <h4 className="font-semibold text-foreground text-sm mb-0.5">{title}</h4>
      <p className="text-xs text-muted-foreground">{description}</p>
    </button>
  );
}

export default MethodCard;
