import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium font-body transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-thinksid-navy text-white",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-red-100 text-red-700",
        outline: "border-thinksid-navy/20 text-thinksid-navy bg-transparent",
        success: "border-transparent bg-electric-lime/30 text-thinksid-navy",
        warning: "border-transparent bg-amber-100 text-amber-800",
        info: "border-transparent bg-thinksid-navy/10 text-thinksid-navy",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
