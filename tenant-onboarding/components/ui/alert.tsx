import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  [
    "relative w-full rounded-lg border p-4",
    "[&>svg~*]:pl-8 [&>svg+div]:translate-y-[-2px]",
    "[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
    "transition-colors duration-200",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-card text-card-foreground border-border",
          "[&>svg]:text-muted-foreground",
        ].join(" "),
        destructive: [
          "bg-destructive/5 border-destructive/20",
          "text-destructive",
          "[&>svg]:text-destructive",
        ].join(" "),
        warning: [
          "bg-warning/5 border-warning/20",
          "text-warm-800",
          "[&>svg]:text-warning",
        ].join(" "),
        success: [
          "bg-success/5 border-success/20",
          "text-sage-800",
          "[&>svg]:text-success",
        ].join(" "),
        info: [
          "bg-terracotta-50 border-terracotta-200",
          "text-terracotta-800",
          "[&>svg]:text-terracotta-600",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1.5 font-medium leading-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm leading-relaxed opacity-90 [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
