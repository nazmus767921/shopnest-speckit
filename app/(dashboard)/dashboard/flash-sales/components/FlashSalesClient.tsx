"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PlusIcon, SearchIcon, PencilIcon, Trash2Icon, ZapIcon, FlameIcon, MoreHorizontalIcon, CalendarIcon, DollarSignIcon, ShoppingBagIcon, TrendingUpIcon } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { getFlashSalesAction, deleteFlashSaleAction, endFlashSaleAction } from "@/app/actions/flash-sales"
import { FlashSaleModal } from "./FlashSaleModal"
import { formatTaka } from "@/lib/utils"

interface Product {
  id: string
  name: string
  pricePaisa: number
  images: Array<{ storagePath: string }>
}

interface FlashSale {
  id: string
  productId: string
  productName: string
  salePricePaisa: number
  limitQuantity: number
  soldQuantity: number
  startTime: Date | string
  endTime: Date | string
  isActive: boolean
}

interface FlashSalesClientProps {
  initialFlashSales: FlashSale[]
  products: Product[]
  merchantId: string
}

function formatPrice(paisa: number): string {
  return formatTaka(paisa)
}

function formatDate(dateStr: Date | string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getSaleStatus(sale: FlashSale): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  const now = new Date()
  const start = new Date(sale.startTime)
  const end = new Date(sale.endTime)

  if (!sale.isActive) {
    return { label: "Ended Manually", variant: "secondary" }
  }
  if (now < start) {
    return { label: "Scheduled", variant: "outline" }
  }
  if (now > end) {
    return { label: "Ended (Expired)", variant: "destructive" }
  }
  if (sale.soldQuantity >= sale.limitQuantity) {
    return { label: "Depleted", variant: "destructive" }
  }
  return { label: "Active", variant: "default" }
}

export function FlashSalesClient({ initialFlashSales, products, merchantId }: FlashSalesClientProps) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<FlashSale | null>(null)

  const { data: flashSales = initialFlashSales } = useQuery({
    queryKey: ["flash-sales", merchantId],
    queryFn: async () => {
      const res = await getFlashSalesAction()
      if (!res.success) throw new Error(res.error)
      return res.flashSales as FlashSale[]
    },
    initialData: initialFlashSales,
    staleTime: 15_000,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteFlashSaleAction(id)
      if (!res.success) throw new Error(res.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flash-sales", merchantId] })
    },
  })

  const endMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await endFlashSaleAction(id)
      if (!res.success) throw new Error(res.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flash-sales", merchantId] })
    },
  })

  const handleOpenCreate = () => {
    setEditingSale(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (sale: FlashSale) => {
    setEditingSale(sale)
    setIsModalOpen(true)
  }

  const handleEndSale = (id: string) => {
    if (confirm("Are you sure you want to end this flash sale immediately?")) {
      endMutation.mutate(id)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this flash sale campaign?")) {
      deleteMutation.mutate(id)
    }
  }

  // KPI Calculations
  const totalCampaigns = flashSales.length
  const activeCampaigns = flashSales.filter((sale) => {
    const now = new Date()
    const start = new Date(sale.startTime)
    const end = new Date(sale.endTime)
    return sale.isActive && now >= start && now <= end && sale.soldQuantity < sale.limitQuantity
  }).length
  const totalRevenuePaisa = flashSales.reduce((acc, sale) => acc + (sale.soldQuantity * sale.salePricePaisa), 0)
  const totalSold = flashSales.reduce((acc, sale) => acc + sale.soldQuantity, 0)
  const totalLimit = flashSales.reduce((acc, sale) => acc + sale.limitQuantity, 0)
  const overallFillRate = totalLimit > 0 ? Math.round((totalSold / totalLimit) * 100) : 0

  // Timeline Setup
  const now = new Date()
  const startOfYesterday = new Date(now)
  startOfYesterday.setDate(now.getDate() - 1)
  startOfYesterday.setHours(0, 0, 0, 0)
  const timelineStartMs = startOfYesterday.getTime()
  const oneDayMs = 24 * 60 * 60 * 1000
  const timelineEndMs = timelineStartMs + 7 * oneDayMs

  const timelineDays = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(timelineStartMs + idx * oneDayMs)
    return {
      label: idx === 1 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
      date: d,
    }
  })

  const timelineSales = flashSales.filter((sale) => {
    const start = new Date(sale.startTime).getTime()
    const end = new Date(sale.endTime).getTime()
    return end >= timelineStartMs && start <= timelineEndMs
  })

  const filteredSales = flashSales.filter((sale) =>
    sale.productName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Analytics KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
        <Card className="p-4 flex flex-col gap-1 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider">Total Campaigns</span>
            <ShoppingBagIcon className="h-4.5 w-4.5" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-foreground mt-1">{totalCampaigns}</span>
        </Card>
        <Card className="p-4 flex flex-col gap-1 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider">Active Campaigns</span>
            <ZapIcon className="h-4.5 w-4.5 text-rose-500 fill-rose-500 animate-pulse" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-rose-500 mt-1">{activeCampaigns}</span>
        </Card>
        <Card className="p-4 flex flex-col gap-1 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider">Total Revenue</span>
            <DollarSignIcon className="h-4.5 w-4.5" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-foreground font-mono mt-1">{formatPrice(totalRevenuePaisa)}</span>
        </Card>
        <Card className="p-4 flex flex-col gap-1 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider">Overall Fill Rate</span>
            <TrendingUpIcon className="h-4.5 w-4.5" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-foreground">{overallFillRate}%</span>
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">({totalSold}/{totalLimit} items)</span>
          </div>
        </Card>
      </div>

      {/* Timeline Visual Scheduler */}
      <Card className="p-5 border-border bg-card flex flex-col gap-4 shadow-sm select-none">
        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
          <CalendarIcon className="h-5 w-5 text-rose-500" />
          <div className="flex flex-col">
            <h4 className="text-sm font-bold text-foreground leading-none">Campaign Scheduler Timeline</h4>
            <span className="text-[10px] text-muted-foreground mt-0.5">Visual scheduling calendar for the next 7 days</span>
          </div>
        </div>

        <div className="overflow-x-auto w-full animate-fade-in">
          <div className="min-w-[800px] flex flex-col relative py-2">
            {/* Timeline Header Days grid labels */}
            <div className="grid grid-cols-7 border-b border-border/50 pb-2 text-center text-[10px] sm:text-xs font-bold text-muted-foreground uppercase">
              {timelineDays.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className={idx === 1 ? "text-rose-500 font-extrabold" : ""}>{day.label}</span>
                </div>
              ))}
            </div>

            {/* Timeline Grid Rows */}
            <div className="relative min-h-[140px] mt-3 flex flex-col gap-2.5">
              {/* Vertical Grid Line Overlays */}
              <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                {Array.from({ length: 7 }).map((_, idx) => (
                  <div key={idx} className="border-r border-dashed border-border/30 h-full last:border-r-0" />
                ))}
              </div>

              {timelineSales.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-muted-foreground text-xs italic font-light">
                  No active or scheduled campaigns in this 7-day period.
                </div>
              ) : (
                timelineSales.map((sale) => {
                  const saleStart = new Date(sale.startTime).getTime()
                  const saleEnd = new Date(sale.endTime).getTime()

                  // Calculate position in percentage
                  const leftOffset = Math.max(0, ((saleStart - timelineStartMs) / (timelineEndMs - timelineStartMs)) * 100)
                  const rightOffset = Math.max(0, ((timelineEndMs - saleEnd) / (timelineEndMs - timelineStartMs)) * 100)
                  const width = Math.max(4, 100 - leftOffset - rightOffset)

                  const status = getSaleStatus(sale)
                  
                  let bgClass = "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400 bg-rose-50/50"
                  if (status.label === "Scheduled") {
                    bgClass = "bg-sky-50/50 border-sky-500/30 text-sky-700 dark:text-sky-400"
                  } else if (status.label.startsWith("Ended") || status.label === "Depleted") {
                    bgClass = "bg-muted/40 border-muted text-muted-foreground"
                  }

                  return (
                    <div key={sale.id} className="relative h-9 w-full">
                      <div
                        className={`absolute h-full rounded-lg border px-3 py-1.5 flex items-center justify-between text-[10px] font-bold shadow-xs truncate select-none transition-all hover:brightness-95 ${bgClass}`}
                        style={{ left: `${leftOffset}%`, width: `${width}%` }}
                        title={`${sale.productName}: ${formatDate(sale.startTime)} - ${formatDate(sale.endTime)}`}
                      >
                        <span className="truncate pr-1">{sale.productName}</span>
                        <span className="shrink-0 bg-white/40 dark:bg-black/25 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide">
                          {status.label}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative max-w-sm w-full">
          <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
            <SearchIcon className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search products in flash sales..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm border border-border rounded-full pl-10 pr-4 py-2 bg-card text-foreground placeholder-muted-foreground outline-none focus:border-muted-foreground transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
          <Button asChild variant="outline" className="flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center rounded-md">
            <Link href="/dashboard/flash-sales/bulk">
              <ZapIcon className="h-4 w-4" />
              <span>Bulk Launch</span>
            </Link>
          </Button>
          <Button onClick={handleOpenCreate} className="flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center rounded-md">
            <PlusIcon className="h-4 w-4" />
            <span>Launch Flash Sale</span>
          </Button>
        </div>
      </div>

      {/* Sales List */}
      {filteredSales.length === 0 ? (
        <Card className="flex flex-col items-center justify-center text-center p-12 border border-border bg-card rounded-xl">
          <div className="p-3 bg-muted rounded-full mb-4">
            <ZapIcon className="h-8 w-8 text-rose-500 stroke-1.5" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            No flash sales configured
          </h3>
          <p className="text-sm text-muted-foreground font-light max-w-sm mt-2 mb-6">
            Launch your first flash sale on any product to display limited-time offers and count downs.
          </p>
          <Button onClick={handleOpenCreate} className="rounded-md">
            Launch First Flash Sale
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden border border-border rounded-xl bg-card">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                  <th className="p-4">Product</th>
                  <th className="p-4">Flash Price</th>
                  <th className="p-4">Progress / Sold</th>
                  <th className="p-4">Start Time</th>
                  <th className="p-4">End Time</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredSales.map((sale) => {
                  const status = getSaleStatus(sale)
                  return (
                    <tr key={sale.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-medium text-foreground">{sale.productName}</td>
                      <td className="p-4 text-rose-500 font-semibold">{formatPrice(sale.salePricePaisa)}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 w-36">
                          <div className="flex justify-between text-xs text-muted-foreground font-mono">
                            <span>{sale.soldQuantity} sold</span>
                            <span>limit {sale.limitQuantity}</span>
                          </div>
                          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-rose-500 h-full transition-all"
                              style={{ width: `${Math.min(100, (sale.soldQuantity / sale.limitQuantity) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{formatDate(sale.startTime)}</td>
                      <td className="p-4 text-muted-foreground">{formatDate(sale.endTime)}</td>
                      <td className="p-4">
                        <Badge variant={status.variant} className="rounded-full">{status.label}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuItem onClick={() => handleOpenEdit(sale)} className="gap-2 cursor-pointer">
                              <PencilIcon className="h-4 w-4 text-muted-foreground" />
                              <span>Edit Settings</span>
                            </DropdownMenuItem>
                            {sale.isActive && (
                              <DropdownMenuItem onClick={() => handleEndSale(sale.id)} className="gap-2 cursor-pointer text-amber-600 dark:text-amber-500">
                                <FlameIcon className="h-4 w-4" />
                                <span>End Sale Early</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDelete(sale.id)} className="gap-2 cursor-pointer text-red-600 dark:text-red-500">
                              <Trash2Icon className="h-4 w-4" />
                              <span>Delete Campaign</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Grid/Cards View */}
          <div className="flex flex-col md:hidden border border-border rounded-xl bg-card overflow-hidden divide-y divide-border/60">
            {filteredSales.map((sale) => {
              const status = getSaleStatus(sale)
              return (
                <div key={sale.id} className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-foreground truncate max-w-[200px]">{sale.productName}</span>
                    <Badge variant={status.variant} className="rounded-full text-[10px]">{status.label}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Price: <strong className="text-rose-500 font-semibold">{formatPrice(sale.salePricePaisa)}</strong></span>
                    <span>{sale.soldQuantity} / {sale.limitQuantity} Sold</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full transition-all"
                      style={{ width: `${Math.min(100, (sale.soldQuantity / sale.limitQuantity) * 100)}%` }}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-[11px] text-muted-foreground/80 font-mono">
                    <span>Start: {formatDate(sale.startTime)}</span>
                    <span>End: {formatDate(sale.endTime)}</span>
                  </div>
                  <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-border/50">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(sale)} className="text-xs flex items-center gap-1.5">
                      <PencilIcon className="h-3 w-3" /> Edit
                    </Button>
                    {sale.isActive && (
                      <Button variant="outline" size="sm" onClick={() => handleEndSale(sale.id)} className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
                        <FlameIcon className="h-3 w-3" /> End Early
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleDelete(sale.id)} className="text-xs text-red-600 dark:text-red-500 flex items-center gap-1.5">
                      <Trash2Icon className="h-3 w-3" /> Delete
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <FlashSaleModal
          editingSale={editingSale}
          products={products}
          onClose={() => setIsModalOpen(false)}
          merchantId={merchantId}
        />
      )}
    </div>
  )
}
