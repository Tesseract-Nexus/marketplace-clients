'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      data-slot="label"
      className={cn(
        // Typography
        'text-sm font-medium leading-none',
        // Color - warm brown
        'text-foreground',
        // Transitions
        'transition-colors duration-150',
        // Required field indicator
        'group-data-[required=true]/field:after:content-["*"] group-data-[required=true]/field:after:ml-0.5 group-data-[required=true]/field:after:text-destructive',
        // Peer disabled state
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
Label.displayName = 'Label';

export { Label };
