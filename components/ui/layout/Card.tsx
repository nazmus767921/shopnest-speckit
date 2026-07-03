import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "featured" | "cinematic" | "pistachio" | "photo"
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg overflow-hidden flex flex-col transition-all duration-200",
          {
            // card-pricing: canvas-light bg, ink text, hairline border, no shadow
            "bg-canvas-light text-ink border border-hairline-light": variant === "default",

            // card-pricing-featured: aloe-10 mint bg, ink text, no shadow
            "bg-aloe-10 text-ink": variant === "featured",

            // card-feature-cinematic: canvas-night-elevated bg, white text, hairline border, no shadow
            "bg-canvas-night-elevated text-on-primary border border-hairline-dark/40": variant === "cinematic",

            // card-pistachio-band: pistachio-10 bg, ink text
            "bg-pistachio-10 text-ink": variant === "pistachio",

            // card-photo-frame: canvas-night, xl rounded corner, no padding, flat black
            "bg-canvas-night rounded-xl p-0": variant === "photo",
          },
          // Card internal padding from DESIGN.md: p-8 (32px) for normal cards, 0 for photo frames
          variant !== "photo" ? "p-8" : "p-0",
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 mb-4", className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-heading-xl font-medium tracking-tight", className)}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-caption text-shade-50", className)}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("grow", className)}
      {...props}
    />
  )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center pt-6 mt-auto", className)}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
