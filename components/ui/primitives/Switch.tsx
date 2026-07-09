import * as React from "react"
import { Switch as ShadcnSwitch } from "../switch"

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof ShadcnSwitch> {}

export const Switch = React.forwardRef<React.ElementRef<typeof ShadcnSwitch>, SwitchProps>(
  ({ className, ...props }, ref) => {
    return (
      <ShadcnSwitch
        ref={ref}
        className={className}
        {...props}
      />
    )
  }
)
Switch.displayName = "Switch"
