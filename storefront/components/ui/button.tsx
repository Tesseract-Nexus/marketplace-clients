import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Core variants (8 total - simplified from 16)
        default: "bg-tenant-primary text-white shadow-sm hover:opacity-90",
        secondary:
          "border border-[var(--border-default)] text-[var(--text-primary)] bg-transparent hover:bg-[var(--surface-muted)] hover:border-[var(--border-strong)]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-tenant-primary underline-offset-4 hover:underline",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        // Tenant-aware variants (simplified - no heavy transforms)
        "tenant-primary": "bg-tenant-primary text-white hover:opacity-90 shadow-sm",
        "tenant-secondary": "border border-tenant-primary text-tenant-primary bg-transparent hover:bg-tenant-primary/10",
        "tenant-ghost": "text-tenant-primary hover:bg-tenant-primary/10",
        // Legacy variants kept for backward compatibility
        outline:
          "border border-tenant-primary text-tenant-primary bg-background hover:bg-tenant-primary/10 dark:bg-input/30 dark:hover:bg-tenant-primary/20",
        "tenant-outline": "border border-tenant-primary text-tenant-primary bg-transparent hover:bg-tenant-primary/10",
        "tenant-gradient": "bg-tenant-primary text-white hover:opacity-90",
        "tenant-glow": "bg-tenant-primary text-white hover:opacity-90",
        "tenant-glass": "bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20",
        "tenant-soft": "bg-tenant-primary/10 text-tenant-primary hover:bg-tenant-primary/20",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-md px-6 has-[>svg]:px-4",
        xl: "h-12 rounded-lg px-8 text-base has-[>svg]:px-5",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps extends React.ComponentProps<"button">,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  loadingText?: string
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  isLoading = false,
  loadingText,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>{loadingText || 'Loading...'}</span>
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
