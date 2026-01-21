import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Info,
  MinusCircle,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1.5 transition-colors",
  {
    variants: {
      status: {
        success:
          "border-transparent bg-success-muted text-success-muted-foreground",
        warning:
          "border-transparent bg-warning-muted text-warning-muted-foreground",
        error:
          "border-transparent bg-error-muted text-error-muted-foreground",
        info: "border-transparent bg-info-muted text-info-muted-foreground",
        neutral:
          "border-transparent bg-neutral-muted text-neutral-muted-foreground",
      },
      size: {
        sm: "px-2 py-0 text-xs [&>svg]:size-3",
        default: "px-2.5 py-0.5 text-xs [&>svg]:size-3.5",
        lg: "px-3 py-1 text-sm [&>svg]:size-4",
      },
    },
    defaultVariants: {
      status: "neutral",
      size: "default",
    },
  }
)

export type StatusType = "success" | "warning" | "error" | "info" | "neutral"

const statusIcons: Record<StatusType, LucideIcon> = {
  success: CheckCircle,
  warning: Clock,
  error: XCircle,
  info: Info,
  neutral: MinusCircle,
}

// Common status mappings for reuse across the app
export const statusMappings = {
  // Order statuses
  order: {
    PENDING: "warning" as StatusType,
    CONFIRMED: "info" as StatusType,
    PROCESSING: "info" as StatusType,
    SHIPPED: "info" as StatusType,
    DELIVERED: "success" as StatusType,
    CANCELLED: "error" as StatusType,
    REFUNDED: "error" as StatusType,
    RETURNED: "warning" as StatusType,
    FAILED: "error" as StatusType,
  },
  // Payment statuses
  payment: {
    PENDING: "warning" as StatusType,
    PAID: "success" as StatusType,
    PARTIALLY_PAID: "warning" as StatusType,
    REFUNDED: "error" as StatusType,
    PARTIALLY_REFUNDED: "warning" as StatusType,
    FAILED: "error" as StatusType,
    CANCELLED: "error" as StatusType,
  },
  // User/customer statuses
  user: {
    ACTIVE: "success" as StatusType,
    INACTIVE: "neutral" as StatusType,
    BLOCKED: "error" as StatusType,
    PENDING: "warning" as StatusType,
    SUSPENDED: "error" as StatusType,
  },
  // Product statuses
  product: {
    ACTIVE: "success" as StatusType,
    INACTIVE: "neutral" as StatusType,
    DRAFT: "warning" as StatusType,
    ARCHIVED: "neutral" as StatusType,
    OUT_OF_STOCK: "error" as StatusType,
  },
  // Coupon statuses
  coupon: {
    ACTIVE: "success" as StatusType,
    EXPIRED: "error" as StatusType,
    SCHEDULED: "info" as StatusType,
    INACTIVE: "neutral" as StatusType,
    USED: "warning" as StatusType,
  },
  // Review statuses
  review: {
    PENDING: "warning" as StatusType,
    APPROVED: "success" as StatusType,
    REJECTED: "error" as StatusType,
    FLAGGED: "error" as StatusType,
  },
  // Generic boolean
  boolean: {
    true: "success" as StatusType,
    false: "neutral" as StatusType,
    yes: "success" as StatusType,
    no: "neutral" as StatusType,
  },
  // Inventory
  inventory: {
    IN_STOCK: "success" as StatusType,
    LOW_STOCK: "warning" as StatusType,
    OUT_OF_STOCK: "error" as StatusType,
  },
  // Vendor statuses
  vendor: {
    APPROVED: "success" as StatusType,
    PENDING: "warning" as StatusType,
    REJECTED: "error" as StatusType,
    SUSPENDED: "error" as StatusType,
    ACTIVE: "success" as StatusType,
    INACTIVE: "neutral" as StatusType,
  },
} as const

interface StatusBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof statusBadgeVariants> {
  /** The status type that determines color and icon */
  status?: StatusType
  /** Optional custom icon (overrides default status icon) */
  icon?: LucideIcon
  /** Whether to show the status icon */
  showIcon?: boolean
  /** The label text to display */
  children: React.ReactNode
}

function StatusBadge({
  className,
  status = "neutral",
  size,
  icon,
  showIcon = true,
  children,
  ...props
}: StatusBadgeProps) {
  const Icon = icon || statusIcons[status]

  return (
    <span
      data-slot="status-badge"
      data-status={status}
      className={cn(statusBadgeVariants({ status, size }), className)}
      {...props}
    >
      {showIcon && <Icon className="shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </span>
  )
}

// Utility function to get status from a mapping
function getStatusFromMapping<T extends keyof typeof statusMappings>(
  category: T,
  value: string | boolean
): StatusType {
  const mapping = statusMappings[category] as Record<string, StatusType>
  const key = typeof value === "boolean" ? String(value) : value.toUpperCase()
  return mapping[key] || "neutral"
}

export { StatusBadge, statusBadgeVariants, getStatusFromMapping }
