"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DashboardHeader({ currentDate, userName }: { currentDate: string, userName?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const currentDays = searchParams.get("days") || "1"

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("days", value)
    router.push(`${pathname}?${params.toString()}`)
  }

  // Calculate dynamic greeting based on local time
  const hour = new Date().getHours()
  let greeting = "Good evening"
  if (hour < 12) greeting = "Good morning"
  else if (hour < 18) greeting = "Good afternoon"
  
  const displayName = userName || "there"

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {currentDate}
        </span>
        <h1 className="text-3xl font-bold tracking-tight leading-tight">
          {greeting}, {displayName}!
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <Select value={currentDays} onValueChange={handleValueChange}>
          <SelectTrigger className="w-[180px] bg-card">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Today</SelectItem>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="365">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
