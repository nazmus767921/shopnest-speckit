import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertTriangle, AlertCircle, CheckCircle, Info } from "lucide-react"

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "warning" | "danger" | "success" | "info"
}

export function Alert({ className, variant = "default", children, ...props }: AlertProps) {
  const Icon = {
    default: Info,
    info: Info,
    warning: AlertTriangle,
    danger: AlertCircle,
    success: CheckCircle,
  }[variant]

  const styles = {
    default: "bg-zinc-50 border-hairline-light text-ink",
    info: "bg-emerald-50 border-emerald-100 text-emerald-800",
    warning: "bg-amber-50 border-amber-100 text-amber-800",
    danger: "bg-red-50 border-red-100 text-red-800",
    success: "bg-emerald-50 border-emerald-100 text-emerald-800",
  }[variant]

  const iconColor = {
    default: "text-shade-50",
    info: "text-emerald-700",
    warning: "text-amber-700",
    danger: "text-red-700",
    success: "text-emerald-700",
  }[variant]

  return (
    <div
      role="alert"
      className={cn(
        "p-3.5 border rounded-lg text-caption font-medium flex items-start gap-2.5",
        styles,
        className
      )}
      {...props}
    >
      <Icon className={cn("h-4.5 w-4.5 shrink-0 mt-0.5", iconColor)} />
      <div className="grow select-text leading-relaxed">{children}</div>
    </div>
  )
}
