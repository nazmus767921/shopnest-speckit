"use client"

import { CartesianGrid, XAxis, Area, AreaChart } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  revenue: {
    label: "Revenue (৳)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function RevenueChart({ data }: { data: { date: string, revenue: number }[] }) {
  // Format data for chart
  const formattedData = data.map(item => {
    // Parse "YYYY-MM-DD" as local time by adding 'T00:00:00'
    const d = new Date(item.date + 'T00:00:00');
    return {
      date: item.date,
      day: d.toLocaleDateString("en-US", { weekday: 'short' }),
      revenue: item.revenue / 100 // Convert Paisa to Taka
    }
  })

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <AreaChart
        accessibilityLayer
        data={formattedData}
        margin={{
          left: 12,
          right: 12,
          top: 12,
          bottom: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Area
          dataKey="revenue"
          type="natural"
          fill="var(--color-revenue)"
          fillOpacity={0.2}
          stroke="var(--color-revenue)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
