import * as React from "react"
import { Alert as ShadcnAlert, AlertDescription } from "../alert"

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "warning" | "danger" | "success" | "info"
}

export function Alert({ className, variant = "default", children, ...props }: AlertProps) {
  let shadcnVariant: "default" | "destructive" = "default"
  if (variant === "danger") shadcnVariant = "destructive"

  return (
    <ShadcnAlert variant={shadcnVariant} className={className} {...props}>
      <AlertDescription>{children}</AlertDescription>
    </ShadcnAlert>
  )
}
