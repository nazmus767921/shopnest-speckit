import * as React from "react"
import { cn } from "@/lib/utils"

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-caption font-medium text-shade-70 select-none",
          className
        )}
        {...props}
      />
    )
  }
)
FormLabel.displayName = "FormLabel"

export { FormLabel }
