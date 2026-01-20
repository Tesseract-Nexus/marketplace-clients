import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  [
    "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5",
    "text-xs font-medium w-fit whitespace-nowrap shrink-0",
    "[&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none",
    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    "transition-colors duration-200",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "border-transparent bg-primary text-primary-foreground",
          "[a&]:hover:bg-primary/90",
        ].join(" "),
        secondary: [
          "border-transparent bg-secondary text-secondary-foreground",
          "[a&]:hover:bg-secondary/90",
        ].join(" "),
        destructive: [
          "bg-destructive/10 text-destructive",
          "border-destructive/20",
          "[a&]:hover:bg-destructive/15",
        ].join(" "),
        success: [
          "bg-success/10 text-sage-700",
          "border-success/20",
          "[a&]:hover:bg-success/15",
        ].join(" "),
        warning: [
          "bg-warning/10 text-warm-700",
          "border-warning/20",
          "[a&]:hover:bg-warning/15",
        ].join(" "),
        info: [
          "bg-terracotta-50 text-terracotta-700",
          "border-terracotta-200",
          "[a&]:hover:bg-terracotta-100",
        ].join(" "),
        outline: [
          "text-foreground border-border",
          "[a&]:hover:bg-secondary [a&]:hover:border-border-strong",
        ].join(" "),
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-px text-[11px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
