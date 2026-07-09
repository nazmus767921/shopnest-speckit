import * as React from "react"
import { Textarea as ShadcnTextarea } from "../textarea"

export interface TextareaProps extends React.ComponentPropsWithoutRef<typeof ShadcnTextarea> {
  error?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <ShadcnTextarea
        ref={ref}
        className={className}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"
