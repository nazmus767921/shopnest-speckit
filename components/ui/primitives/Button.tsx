import * as React from "react"
import { Button as ShadcnButton } from "../button"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline-dark" | "outline-light" | "aloe" | "ghost"
  size?: "sm" | "md" | "lg"
  as?: React.ElementType
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", as: Component, ...props }, ref) => {
    let shadcnVariant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" = "default"
    if (variant === "primary") shadcnVariant = "default"
    else if (variant === "secondary") shadcnVariant = "secondary"
    else if (variant === "outline-dark" || variant === "outline-light") shadcnVariant = "outline"
    else if (variant === "aloe") shadcnVariant = "secondary"
    else if (variant === "ghost") shadcnVariant = "ghost"

    let shadcnSize: "default" | "sm" | "lg" | "icon" = "default"
    if (size === "sm") shadcnSize = "sm"
    else if (size === "md") shadcnSize = "default"
    else if (size === "lg") shadcnSize = "lg"

    return (
      <ShadcnButton
        ref={ref}
        variant={shadcnVariant}
        size={shadcnSize}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
