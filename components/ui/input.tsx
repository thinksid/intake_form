import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-14 w-full rounded-2xl border-2 border-border bg-white px-4 py-3 text-base font-body text-thinksid-navy placeholder:text-slate-gray/60 transition-all duration-200 ease-out",
          "hover:border-thinksid-navy/30",
          "focus:border-thinksid-navy focus:outline-none focus:ring-2 focus:ring-electric-lime/30",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
