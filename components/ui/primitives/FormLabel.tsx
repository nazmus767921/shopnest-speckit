import * as React from "react"
import { Label } from "../label"

export interface FormLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {}

export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <Label
        ref={ref}
        className={className}
        {...props}
      />
    )
  }
)
FormLabel.displayName = "FormLabel"
