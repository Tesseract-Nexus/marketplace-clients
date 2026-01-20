"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Structure
        "peer inline-flex h-6 w-11 shrink-0 items-center rounded-full",
        // Border and shadow
        "border border-transparent shadow-sm",
        // Transitions
        "transition-colors duration-200",
        // Focus
        "outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // Unchecked state
        "data-[state=unchecked]:bg-muted data-[state=unchecked]:border-border",
        // Checked state - terracotta
        "data-[state=checked]:bg-primary",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Structure
          "pointer-events-none block h-5 w-5 rounded-full",
          // Background
          "bg-white shadow-sm",
          // Border
          "border border-border/10",
          // Transitions
          "transition-transform duration-200",
          // Position states
          "data-[state=unchecked]:translate-x-0.5",
          "data-[state=checked]:translate-x-[calc(100%-2px)]"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
