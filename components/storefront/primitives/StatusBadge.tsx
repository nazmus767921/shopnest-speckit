import React from "react"

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  let statusText = status.replace("_", " ")
  let colorClasses = ""
  let dotClasses = ""

  switch (status) {
    case "pending_payment":
      statusText = "Pending Payment"
      colorClasses = "bg-amber-500/10 text-amber-800 border-amber-500/20"
      dotClasses = "bg-amber-500 animate-pulse"
      break
    case "processing":
      colorClasses = "bg-blue-500/10 text-blue-800 border-blue-500/20"
      dotClasses = "bg-blue-500"
      break
    case "shipped":
      colorClasses = "bg-indigo-500/10 text-indigo-800 border-indigo-500/20"
      dotClasses = "bg-indigo-500"
      break
    case "delivered":
      colorClasses = "bg-emerald-500/10 text-emerald-800 border-emerald-500/20"
      dotClasses = "bg-emerald-500"
      break
    case "cancelled":
      colorClasses = "bg-rose-500/10 text-rose-800 border-rose-500/20"
      dotClasses = "bg-rose-500"
      break
    default:
      colorClasses = "bg-zinc-500/10 text-zinc-800 border-zinc-500/20"
      dotClasses = "bg-zinc-500"
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-sans font-semibold uppercase tracking-wider border whitespace-nowrap shrink-0 ${colorClasses} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotClasses}`} />
      <span>{statusText}</span>
    </span>
  )
}
