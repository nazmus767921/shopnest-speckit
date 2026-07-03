import React from "react"
import { Card } from "@/components/ui"
import { LucideIcon } from "lucide-react"

interface SystemOverviewCardProps {
  title: string
  value: string | number
  description: string
  icon: LucideIcon
  iconBgClass?: string
  iconTextClass?: string
  footer?: React.ReactNode
}

export function SystemOverviewCard({
  title,
  value,
  description,
  icon: Icon,
  iconBgClass = "bg-canvas-cream text-ink border border-hairline-light",
  iconTextClass = "text-shade-60",
  footer,
}: SystemOverviewCardProps) {
  return (
    <Card
      variant="default"
      className="border border-hairline-light bg-canvas-light p-6 flex flex-col justify-between min-h-47.5 hover:border-shade-40 transition-all duration-300 rounded-2xl"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-eyebrow-cap font-semibold text-shade-50 tracking-wider">
            {title}
          </span>
          <div className={`p-2.5 rounded-xl ${iconBgClass}`}>
            <Icon className={`h-4.5 w-4.5 ${iconTextClass}`} />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-display-md font-bold font-sans tracking-tight text-ink leading-none">
            {value}
          </span>
          <span className="text-caption text-shade-40 font-light mt-1">
            {description}
          </span>
        </div>
      </div>
      {footer && (
        <div className="flex items-center pt-3 border-t border-hairline-light mt-2 w-full">
          {footer}
        </div>
      )}
    </Card>
  )
}
