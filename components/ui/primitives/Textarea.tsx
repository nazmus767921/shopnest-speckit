import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex w-full bg-canvas-light text-ink font-sans text-body-md rounded-md border border-hairline-light px-3 py-2.5 min-h-[100px] transition-colors duration-200 placeholder:text-shade-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-light disabled:cursor-not-allowed disabled:opacity-50 resize-y",
          {
            "border-red-500 focus-visible:ring-red-500": error,
          },
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
