import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[140px] w-full rounded-2xl border-2 border-border bg-white px-4 py-4 text-base font-body text-thinksid-navy placeholder:text-slate-gray/60 transition-all duration-200 ease-out resize-none",
          "hover:border-thinksid-navy/30",
          "focus:border-thinksid-navy focus:outline-none focus:ring-2 focus:ring-electric-lime/30",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
