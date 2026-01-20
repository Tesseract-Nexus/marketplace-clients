import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles - warm editorial
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-lg text-sm font-medium",
    "transition-colors duration-200",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
    "outline-none",
    // Focus ring - terracotta
    "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-ring",
    // Aria states
    "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "hover:bg-primary-hover",
          "border border-transparent",
        ].join(" "),
        destructive: [
          "bg-destructive text-destructive-foreground",
          "hover:bg-destructive/90",
          "focus-visible:ring-destructive/30",
        ].join(" "),
        outline: [
          "border border-border bg-background",
          "hover:bg-secondary hover:border-border-strong",
        ].join(" "),
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80",
          "border border-transparent",
        ].join(" "),
        ghost: [
          "hover:bg-secondary hover:text-secondary-foreground",
        ].join(" "),
        link: [
          "text-primary underline-offset-4",
          "hover:underline",
          "p-0 h-auto",
        ].join(" "),
        // Success variant - Sage green
        success: [
          "bg-success text-success-foreground",
          "hover:bg-sage-600",
          "border border-transparent",
        ].join(" "),
      },
      size: {
        default: "h-10 px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-8 rounded-md gap-1.5 px-3.5 text-xs has-[>svg]:px-2.5",
        lg: "h-12 rounded-lg px-8 text-base has-[>svg]:px-6",
        xl: "h-14 rounded-xl px-10 text-lg font-semibold has-[>svg]:px-8",
        icon: "size-10 rounded-lg",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-12 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
