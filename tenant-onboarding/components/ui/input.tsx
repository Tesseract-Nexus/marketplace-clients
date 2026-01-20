import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base structure
        "h-11 w-full min-w-0 rounded-lg px-4 py-2.5",
        // Typography
        "text-base md:text-sm font-medium",
        // Background - cream/warm
        "bg-background border border-border",
        // Placeholder styling
        "placeholder:text-muted-foreground placeholder:font-normal",
        // Selection styling
        "selection:bg-terracotta-100 selection:text-foreground",
        // Smooth transition
        "transition-colors duration-200",
        // Focus state - terracotta ring
        "outline-none",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20",
        // Hover state
        "hover:border-border-strong",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
        // File input styling
        "file:text-foreground file:inline-flex file:h-8 file:border-0",
        "file:bg-secondary file:rounded-md file:px-3 file:mr-3",
        "file:text-sm file:font-medium file:cursor-pointer",
        "file:hover:bg-secondary/80",
        // Validation states
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        // Success state
        "data-[success=true]:border-success data-[success=true]:ring-success/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
