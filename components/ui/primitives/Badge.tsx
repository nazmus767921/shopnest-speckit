import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "mint" | "shade" | "outline"
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "mint", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          // Base styles from DESIGN.md: rounded-pill, text-eyebrow-cap layout (uppercase is in typography class)
          "inline-flex items-center justify-center text-eyebrow-cap rounded-full py-1 px-3 select-none",
          
          // Variants
          {
            // pill-tag-mint: aloe-10 background, ink text
            "bg-aloe-10 text-ink": variant === "mint",
            
            // pill-tag-shade: shade-30 background, ink text
            "bg-shade-30 text-ink": variant === "shade",
            
            // outline badge: transparent background with hairline border
            "bg-transparent border border-hairline-light text-ink dark:border-hairline-dark dark:text-on-primary": variant === "outline",
          },
          className
        )}
        {...props}
      />
    )
  }
)

Badge.displayName = "Badge"

export { Badge }
