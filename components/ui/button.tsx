import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium font-body transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-lime focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary: Navy background with white text
        default: "bg-thinksid-navy text-white hover:bg-thinksid-navy/90 shadow-soft hover:shadow-card",
        // CTA/Highlight: Lime background with navy text
        cta: "bg-electric-lime text-thinksid-navy hover:bg-electric-lime/90 shadow-soft hover:shadow-card font-semibold",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft",
        outline: "border-2 border-thinksid-navy/20 bg-transparent text-thinksid-navy hover:bg-thinksid-navy/5 hover:border-thinksid-navy/40",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "text-thinksid-navy hover:bg-thinksid-navy/5",
        link: "text-thinksid-navy underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-3 text-sm rounded-2xl",
        sm: "h-10 px-4 py-2 text-sm rounded-xl",
        lg: "h-14 px-8 py-4 text-base rounded-2xl",
        xl: "h-16 px-10 py-5 text-lg rounded-3xl",
        icon: "h-12 w-12 rounded-2xl",
        "icon-sm": "h-10 w-10 rounded-xl",
        "icon-lg": "h-14 w-14 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
