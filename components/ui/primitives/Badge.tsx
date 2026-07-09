import * as React from "react"
import { Badge as ShadcnBadge } from "../badge"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "mint" | "shade" | "outline"
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "mint", ...props }, ref) => {
    let shadcnVariant: "default" | "secondary" | "destructive" | "outline" = "secondary"
    if (variant === "outline") {
      shadcnVariant = "outline"
    }
    return <ShadcnBadge ref={ref} variant={shadcnVariant} {...props} />
  }
)
Badge.displayName = "Badge"
