"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // Structure
        "inline-flex h-11 items-center justify-center gap-1 p-1",
        // Shape
        "rounded-lg",
        // Background - warm
        "bg-muted",
        "border border-border",
        // Text
        "text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Structure
        "inline-flex items-center justify-center gap-2 whitespace-nowrap",
        "px-4 py-2",
        // Shape
        "rounded-md",
        // Typography
        "text-sm font-medium",
        // Transitions
        "transition-colors duration-200",
        // Focus
        "ring-offset-background outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-2",
        // Disabled
        "disabled:pointer-events-none disabled:opacity-50",
        // Default state
        "text-muted-foreground hover:text-foreground hover:bg-background/50",
        // Active state - warm styling
        "data-[state=active]:bg-background data-[state=active]:text-foreground",
        "data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
