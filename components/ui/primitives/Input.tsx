import * as React from "react"
import { Input as ShadcnInput } from "../input"

export interface InputProps extends React.ComponentPropsWithoutRef<typeof ShadcnInput> {
  error?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <ShadcnInput
        ref={ref}
        className={className}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"
