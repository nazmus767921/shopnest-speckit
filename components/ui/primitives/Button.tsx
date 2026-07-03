import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline-dark" | "outline-light" | "aloe" | "ghost"
  size?: "sm" | "md" | "lg"
  as?: React.ElementType
  [key: string]: any
}

const Button = React.forwardRef<any, ButtonProps>(
  ({ className, variant = "primary", size = "md", as: Component = "button", ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          // Base styles: pill shape, font-sans, flex alignment, transitions, focus outlines
          "inline-flex items-center justify-center font-sans font-medium rounded-full cursor-pointer select-none transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-canvas-light",
          "disabled:pointer-events-none disabled:bg-shade-30 disabled:text-shade-50 disabled:border-transparent",

          // Variants
          {
            // button-primary-pill: solid black, text white. Pressed state: lifts to shade-70
            "bg-primary text-on-primary! hover:bg-shade-70 active:bg-shade-70": variant === "primary",

            // button-secondary-pill: solid gray, text black
            "bg-shade-30 text-ink! hover:bg-shade-40 active:bg-shade-50 focus-visible:ring-offset-canvas-light": variant === "secondary",

            // button-outline-on-dark: transparent canvas, 2px solid white border, text white
            "bg-canvas-night border-2 border-on-primary text-on-primary! hover:bg-on-primary hover:text-primary! active:bg-on-primary/95 focus-visible:ring-on-primary focus-visible:ring-offset-canvas-night": variant === "outline-dark",

            // button-outline-on-light: transparent canvas, 1px solid black border, text black
            "bg-canvas-light border border-ink text-ink! hover:bg-primary hover:text-on-primary! active:bg-shade-70 active:text-on-primary! focus-visible:ring-primary focus-visible:ring-offset-canvas-light": variant === "outline-light",

            // button-aloe-pill: mint background, text black. Used on pricing pages
            "bg-aloe-10 text-ink! hover:bg-aloe-10/90 active:bg-aloe-10/85 focus-visible:ring-primary focus-visible:ring-offset-canvas-cream": variant === "aloe",

            // ghost button
            "bg-transparent text-current hover:bg-black/5 dark:hover:bg-white/10": variant === "ghost",
          },

          // Sizes
          {
            "text-caption py-2 px-4 min-h-9.5": size === "sm",
            "text-body-md py-3 px-6 min-h-11": size === "md" && variant !== "outline-dark",
            "text-body-md py-3 px-6.5 min-h-11": size === "md" && variant === "outline-dark", // Special padding for outline-dark from DESIGN.md
            "text-body-lg py-3.5 px-7 min-h-12.5": size === "lg",
          },
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button }
