import * as React from "react"
import {
  Card as ShadcnCard,
  CardHeader as ShadcnCardHeader,
  CardTitle as ShadcnCardTitle,
  CardDescription as ShadcnCardDescription,
  CardContent as ShadcnCardContent,
  CardFooter as ShadcnCardFooter,
} from "../card"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "featured" | "cinematic" | "pistachio" | "photo"
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return <ShadcnCard ref={ref} className={className} {...props} />
  }
)
Card.displayName = "Card"

export const CardHeader = ShadcnCardHeader
export const CardTitle = ShadcnCardTitle
export const CardDescription = ShadcnCardDescription
export const CardContent = ShadcnCardContent
export const CardFooter = ShadcnCardFooter
