"use client"

import React, { useState, useEffect, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Card, Button, AlertDialog } from "@/components/ui"
import { StatusBadge } from "./StatusBadge"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Phone,
  Calendar,
  Copy,
  Check,
  CheckCircle2,
  Truck,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { getOrdersAction, confirmPaymentAction, updateOrderStatusAction } from "../actions"
import { useRealtimeOrders } from "@/hooks/use-realtime-orders"

interface OrderListItem {
  id: string
  createdAt: Date
  status: string
  deliveryName: string
  deliveryPhone: string
  totalPaisa: number
  paymentConfirmation: {
    paymentMethod: string
    transactionId: string
  } | null
}

interface OrdersClientProps {
  initialData: {
    items: OrderListItem[]
    totalCount: number
    totalPages: number
    currentPage: number
    counts?: Record<string, number>
  }
  merchantId: string
}

export function OrdersClient({ initialData, merchantId }: OrdersClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentStatus = searchParams.get("status") || "all"
  const currentSearch = searchParams.get("search") || ""
  const currentPage = parseInt(searchParams.get("page") || "1", 10)
  const currentSortBy = searchParams.get("sortBy") || "newest"
  const currentPaymentMethod = searchParams.get("paymentMethod") || "all"

  const [searchInput, setSearchInput] = useState(currentSearch)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Track which order is undergoing which inline status transition
  const [activeActionOrderId, setActiveActionOrderId] = useState<string | null>(null)

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogConfig, setDialogConfig] = useState<{
    title: string
    description: string
    onConfirm: () => void
    confirmText: string
    variant: "primary" | "danger" | "emerald"
  } | null>(null)

  const openConfirmation = (config: {
    title: string
    description: string
    onConfirm: () => void
    confirmText: string
    variant: "primary" | "danger" | "emerald"
  }) => {
    setDialogConfig(config)
    setDialogOpen(true)
  }

  // Sync state with search params on load/change
  useEffect(() => {
    setSearchInput(currentSearch)
  }, [currentSearch])

  const updateFilters = (newParams: {
    status?: string
    search?: string
    page?: number
    sortBy?: string
    paymentMethod?: string
  }) => {
    const params = new URLSearchParams(searchParams.toString())

    if (newParams.status !== undefined) {
      if (newParams.status === "all") {
        params.delete("status")
      } else {
        params.set("status", newParams.status)
      }
      params.set("page", "1") // reset page on filter change
    }

    if (newParams.search !== undefined) {
      if (!newParams.search) {
        params.delete("search")
      } else {
        params.set("search", newParams.search)
      }
      params.set("page", "1") // reset page on search
    }

    if (newParams.sortBy !== undefined) {
      if (newParams.sortBy === "newest") {
        params.delete("sortBy")
      } else {
        params.set("sortBy", newParams.sortBy)
      }
      params.set("page", "1")
    }

    if (newParams.paymentMethod !== undefined) {
      if (newParams.paymentMethod === "all") {
        params.delete("paymentMethod")
      } else {
        params.set("paymentMethod", newParams.paymentMethod)
      }
      params.set("page", "1")
    }

    if (newParams.page !== undefined) {
      params.set("page", newParams.page.toString())
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search: searchInput })
  }

  const handleCopy = (e: React.MouseEvent, text: string, type: "id" | "txid") => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopiedId(`${type}-${text}`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleQuickAction = (
    orderId: string,
    actionName: string,
    actionFn: () => Promise<{ success: boolean; error?: string }>
  ) => {
    setActiveActionOrderId(`${orderId}-${actionName}`)
    startTransition(async () => {
      try {
        const res = await actionFn()
        if (res.success) {
          router.refresh()
        } else {
          openConfirmation({
            title: "Action Failed",
            description: res.error || "An error occurred while updating the order status.",
            confirmText: "Dismiss",
            variant: "danger",
            onConfirm: () => setDialogOpen(false),
          })
        }
      } catch (err: any) {
        openConfirmation({
          title: "Unexpected Error",
          description: err.message || "An unexpected error occurred.",
          confirmText: "Dismiss",
          variant: "danger",
          onConfirm: () => setDialogOpen(false),
        })
      } finally {
        setActiveActionOrderId(null)
      }
    })
  }

  const confirmQuickAction = (
    orderId: string,
    actionName: string,
    title: string,
    description: string,
    confirmText: string,
    variant: "primary" | "danger" | "emerald",
    actionFn: () => Promise<{ success: boolean; error?: string }>
  ) => {
    openConfirmation({
      title,
      description,
      confirmText,
      variant,
      onConfirm: () => {
        setDialogOpen(false)
        handleQuickAction(orderId, actionName, actionFn)
      }
    })
  }

  const formatTaka = (paisa: number) => {
    return `৳ ${(paisa / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const [latestOrderId, setLatestOrderId] = useState<string | null>(null)

  // TanStack Query to manage the orders list server state
  const { data: ordersData = initialData } = useQuery({
    queryKey: [
      "orders",
      merchantId,
      currentStatus,
      currentSearch,
      currentPage,
      currentSortBy,
      currentPaymentMethod
    ],
    queryFn: async () => {
      const response = await getOrdersAction({
        status: currentStatus,
        search: currentSearch,
        page: currentPage,
        limit: 20,
        sortBy: currentSortBy,
        paymentMethod: currentPaymentMethod,
      })
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.ordersData
    },
    initialData,
    refetchOnMount: true,
  })

  // Subscribe to realtime order notifications
  useRealtimeOrders(merchantId, (orderId) => {
    setLatestOrderId(orderId)
    setTimeout(() => {
      setLatestOrderId(null)
    }, 2000)
  })

  const orders = ordersData.items
  const counts = ordersData.counts || {
    all: 0,
    pending_payment: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  }

  const statusTabs = [
    { label: "All", value: "all", count: counts.all },
    { label: "Pending", value: "pending_payment", count: counts.pending_payment },
    { label: "Processing", value: "processing", count: counts.processing },
    { label: "Shipped", value: "shipped", count: counts.shipped },
    { label: "Delivered", value: "delivered", count: counts.delivered },
    { label: "Cancelled", value: "cancelled", count: counts.cancelled },
  ]

  return (
    <div className="flex flex-col gap-6 text-ink">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-hairline-light">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-heading-xl tracking-tight text-ink font-semibold leading-none">
            Order Management
          </h1>
          <p className="text-caption text-shade-50 font-light mt-1">
            Review bKash/Nagad transactions, confirm payments, and progress delivery statuses.
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col gap-4">
        {/* Horizontal Status Tabs & Select Dropdowns */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex bg-zinc-100/85 p-1 rounded-full gap-1 items-center select-none w-fit border border-hairline-light overflow-x-auto scrollbar-none">
            {statusTabs.map((tab) => {
              const isActive = currentStatus === tab.value
              return (
                <button
                  key={tab.value}
                  onClick={() => updateFilters({ status: tab.value })}
                  disabled={isPending}
                  className={`px-5 py-1.5 rounded-full text-caption font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${isActive
                    ? "bg-white text-ink border border-hairline-light"
                    : "text-shade-60 hover:text-ink hover:bg-zinc-200/50"
                    }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${isActive ? "bg-zinc-100 text-ink" : "bg-zinc-200/60 text-shade-60"
                      }`}
                  >
                    {tab.count ?? 0}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Sorting and Payment method filters */}
          <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
            <div className="flex items-center gap-2 grow sm:grow-0">
              <span className="text-caption text-shade-50 font-medium">Payment:</span>
              <select
                value={currentPaymentMethod}
                onChange={(e) => updateFilters({ paymentMethod: e.target.value })}
                disabled={isPending}
                className="text-caption border border-hairline-light bg-canvas-light text-ink rounded-full px-4 py-2 min-h-10 outline-none focus:border-shade-60 transition-all grow sm:grow-0 cursor-pointer font-semibold"
              >
                <option value="all">All Methods</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
              </select>
            </div>

            <div className="flex items-center gap-2 grow sm:grow-0">
              <span className="text-caption text-shade-50 font-medium">Sort:</span>
              <select
                value={currentSortBy}
                onChange={(e) => updateFilters({ sortBy: e.target.value })}
                disabled={isPending}
                className="text-caption border border-hairline-light bg-canvas-light text-ink rounded-full px-4 py-2 min-h-10 outline-none focus:border-shade-60 transition-all grow sm:grow-0 cursor-pointer font-semibold"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="total_desc">Total: High to Low</option>
                <option value="total_asc">Total: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:max-w-md">
          <div className="relative grow">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-shade-40" />
            <input
              type="text"
              placeholder="Search by customer name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full text-caption border border-hairline-light bg-canvas-light text-ink placeholder-shade-40 rounded-full pl-10 pr-4 h-10 outline-none focus:border-shade-60 transition-all font-sans"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isPending}
            className="text-caption px-4 h-10 cursor-pointer"
          >
            Search
          </Button>
        </form>
      </div>

      {/* Main List Area */}
      {isPending ? (
        <div className="flex items-center justify-center p-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center text-center p-12 border border-hairline-light bg-canvas-light max-w-xl mx-auto w-full mt-4">
          <div className="p-4 bg-pistachio-10 text-emerald-900 rounded-full mb-4">
            <Search className="h-8 w-8 stroke-1.5" />
          </div>
          <h3 className="font-display text-heading-md font-semibold text-ink">
            No orders found
          </h3>
          <p className="text-caption text-shade-50 font-light max-w-sm mt-2">
            Try adjusting your status filters or search term to locate the records.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-hairline-light bg-canvas-light">
            <table className="w-full border-collapse text-left text-caption">
              <thead>
                <tr className="border-b border-hairline-light bg-canvas-cream/35 text-shade-50 font-semibold">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Payment Info</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-light">
                {orders.map((order) => {
                  const txId = order.paymentConfirmation?.transactionId
                  const isIdCopied = copiedId === `id-${order.id}`
                  const isTxCopied = copiedId === `txid-${txId}`

                  const isNewOrder = order.id === latestOrderId

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-canvas-cream/10 transition-colors duration-150 ${isNewOrder ? "animate-new-order-highlight" : ""
                        }`}
                    >
                      <td className="p-4 font-mono font-medium align-middle">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-20" title={order.id}>
                            #{order.id.slice(0, 8)}
                          </span>
                          <button
                            onClick={(e) => handleCopy(e, order.id, "id")}
                            className="text-shade-40 hover:text-ink cursor-pointer p-0.5"
                          >
                            {isIdCopied ? <Check className="h-3 w-3 text-emerald-700" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-shade-60 align-middle">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-ink">{order.deliveryName}</span>
                          <span className="text-[12px] text-shade-50 flex items-center gap-1">
                            <Phone className="h-3 w-3 shrink-0" />
                            {order.deliveryPhone}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        {order.paymentConfirmation ? (
                          <div className="flex flex-col gap-0.5">
                            {order.paymentConfirmation.paymentMethod === "cod" ? (
                              <span className="inline-flex items-center rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider self-start">
                                COD
                              </span>
                            ) : (
                              <span className="font-semibold capitalize text-ink">
                                {order.paymentConfirmation.paymentMethod}
                              </span>
                            )}
                            <span className="text-[12px] font-mono text-shade-50 flex items-center gap-1">
                              TxID: {txId}
                              <button
                                onClick={(e) => handleCopy(e, txId || "", "txid")}
                                className="text-shade-40 hover:text-ink cursor-pointer p-0.5"
                              >
                                {isTxCopied ? (
                                  <Check className="h-3 w-3 text-emerald-700" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </span>
                          </div>
                        ) : (
                          <span className="text-shade-40 italic">Not submitted</span>
                        )}
                      </td>
                      <td className="p-4 font-mono font-bold text-ink align-middle">
                        {formatTaka(order.totalPaisa)}
                      </td>
                      <td className="p-4 align-middle">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="p-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-2">
                          {/* Quick Action Button for Desktop */}
                          {order.status === "pending_payment" && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                confirmQuickAction(
                                  order.id,
                                  "confirm",
                                  "Confirm Payment",
                                  `Have you verified this transaction in your bKash/Nagad merchant statement? Confirming will update order #${order.id.slice(0, 8)} status to processing and email the customer.`,
                                  "Confirm Payment",
                                  "emerald",
                                  () => confirmPaymentAction(order.id)
                                )
                              }}
                              disabled={isPending || activeActionOrderId !== null}
                              className="h-8 py-1 px-3 text-caption flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 border-none text-white shrink-0 cursor-pointer"
                            >
                              {activeActionOrderId === `${order.id}-confirm` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              <span>Confirm</span>
                            </Button>
                          )}

                          {order.status === "processing" && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                confirmQuickAction(
                                  order.id,
                                  "ship",
                                  "Mark as Shipped",
                                  `Are you sure you want to mark order #${order.id.slice(0, 8)} as shipped? This will notify the customer via email.`,
                                  "Mark as Shipped",
                                  "primary",
                                  () => updateOrderStatusAction(order.id, "shipped")
                                )
                              }}
                              disabled={isPending || activeActionOrderId !== null}
                              className="h-8 py-1 px-3 text-caption flex items-center gap-1.5 bg-primary text-on-primary hover:bg-shade-70 shrink-0 cursor-pointer"
                            >
                              {activeActionOrderId === `${order.id}-ship` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Truck className="h-3.5 w-3.5" />
                              )}
                              <span>Ship</span>
                            </Button>
                          )}

                          {order.status === "shipped" && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                confirmQuickAction(
                                  order.id,
                                  "deliver",
                                  "Mark as Delivered",
                                  `Are you sure order #${order.id.slice(0, 8)} has been delivered? This will finalize the order and complete processing.`,
                                  "Mark as Delivered",
                                  "emerald",
                                  () => updateOrderStatusAction(order.id, "delivered")
                                )
                              }}
                              disabled={isPending || activeActionOrderId !== null}
                              className="h-8 py-1 px-3 text-caption flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 border-none text-white shrink-0 cursor-pointer"
                            >
                              {activeActionOrderId === `${order.id}-deliver` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              <span>Deliver</span>
                            </Button>
                          )}

                          <Link href={`/dashboard/orders/${order.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 py-1 px-3 text-caption flex items-center gap-1 border border-hairline-light cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View</span>
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (A11y Fixed) */}
          <div className="flex flex-col gap-4 md:hidden">
            {orders.map((order) => {
              const txId = order.paymentConfirmation?.transactionId
              const isIdCopied = copiedId === `id-${order.id}`
              const isTxCopied = copiedId === `txid-${txId}`

              const isNewOrder = order.id === latestOrderId

              return (
                <Card
                  key={order.id}
                  className={`border border-hairline-light bg-canvas-light p-5 hover:border-shade-40 transition-colors duration-200 ${isNewOrder ? "animate-new-order-highlight" : ""
                    }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-hairline-light/50 pb-3 mb-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 font-mono text-[13px] font-semibold text-ink">
                        <span>#{order.id.slice(0, 8)}</span>
                        <button
                          onClick={(e) => handleCopy(e, order.id, "id")}
                          className="text-shade-40 hover:text-ink cursor-pointer p-0.5"
                        >
                          {isIdCopied ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <span className="text-[12px] text-shade-40 flex items-center gap-1 font-medium">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-eyebrow-cap font-semibold text-shade-40 uppercase tracking-wider">
                        Customer
                      </span>
                      <span className="text-body-md font-semibold text-ink">
                        {order.deliveryName}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-eyebrow-cap font-semibold text-shade-40 uppercase tracking-wider">
                        Phone
                      </span>
                      <span className="text-caption text-ink font-medium">
                        {order.deliveryPhone}
                      </span>
                    </div>

                    {order.paymentConfirmation && (
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-eyebrow-cap font-semibold text-shade-40 uppercase tracking-wider">
                          Payment
                        </span>
                        <div className="flex items-center gap-1.5 text-caption text-ink font-mono text-[13px]">
                          {order.paymentConfirmation.paymentMethod === "cod" ? (
                            <span className="inline-flex items-center rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                              COD
                            </span>
                          ) : (
                            <span className="capitalize font-sans font-semibold">
                              {order.paymentConfirmation.paymentMethod}
                            </span>
                          )}
                          <span>({txId})</span>
                          <button
                            onClick={(e) => handleCopy(e, txId || "", "txid")}
                            className="text-shade-40 hover:text-ink cursor-pointer p-0.5"
                          >
                            {isTxCopied ? (
                              <Check className="h-3 w-3 text-emerald-700" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-baseline gap-2 border-t border-hairline-light/40 pt-3 mt-1">
                      <span className="text-eyebrow-cap font-bold text-shade-40 uppercase tracking-wider">
                        Total Amount
                      </span>
                      <span className="text-body-strong font-mono font-bold text-ink">
                        {formatTaka(order.totalPaisa)}
                      </span>
                    </div>

                    {/* Bottom Action Bar for Mobile Cards (Fixes Nested Link A11y Violations) */}
                    <div className="flex items-center justify-between gap-3 border-t border-hairline-light/40 pt-4 mt-4">
                      <Link href={`/dashboard/orders/${order.id}`} className="grow sm:grow-0">
                        <Button
                          variant="outline-light"
                          size="sm"
                          className="w-full text-caption h-9 px-3 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Details</span>
                        </Button>
                      </Link>

                      {order.status === "pending_payment" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            confirmQuickAction(
                              order.id,
                              "confirm",
                              "Confirm Payment",
                              `Have you verified this transaction in your bKash/Nagad merchant statement? Confirming will update order #${order.id.slice(0, 8)} status to processing and email the customer.`,
                              "Confirm Payment",
                              "emerald",
                              () => confirmPaymentAction(order.id)
                            )
                          }}
                          disabled={isPending || activeActionOrderId !== null}
                          className="grow sm:grow-0 h-9 py-1.5 px-3 text-caption flex items-center justify-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 border-none text-white cursor-pointer"
                        >
                          {activeActionOrderId === `${order.id}-confirm` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          <span>Confirm</span>
                        </Button>
                      )}

                      {order.status === "processing" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            confirmQuickAction(
                              order.id,
                              "ship",
                              "Mark as Shipped",
                              `Are you sure you want to mark order #${order.id.slice(0, 8)} as shipped? This will notify the customer via email.`,
                              "Mark as Shipped",
                              "primary",
                              () => updateOrderStatusAction(order.id, "shipped")
                            )
                          }}
                          disabled={isPending || activeActionOrderId !== null}
                          className="grow sm:grow-0 h-9 py-1.5 px-3 text-caption flex items-center justify-center gap-1.5 bg-primary text-on-primary hover:bg-shade-70 cursor-pointer"
                        >
                          {activeActionOrderId === `${order.id}-ship` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Truck className="h-3.5 w-3.5" />
                          )}
                          <span>Ship</span>
                        </Button>
                      )}

                      {order.status === "shipped" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            confirmQuickAction(
                              order.id,
                              "deliver",
                              "Mark as Delivered",
                              `Are you sure order #${order.id.slice(0, 8)} has been delivered? This will finalize the order and complete processing.`,
                              "Mark as Delivered",
                              "emerald",
                              () => updateOrderStatusAction(order.id, "delivered")
                            )
                          }}
                          disabled={isPending || activeActionOrderId !== null}
                          className="grow sm:grow-0 h-9 py-1.5 px-3 text-caption flex items-center justify-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 border-none text-white cursor-pointer"
                        >
                          {activeActionOrderId === `${order.id}-deliver` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          <span>Deliver</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {ordersData.totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 mt-2 pt-4 border-t border-hairline-light">
              <span className="text-caption text-shade-50">
                Page <span className="font-semibold text-ink">{currentPage}</span> of{" "}
                <span className="font-semibold text-ink">{ordersData.totalPages}</span>
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline-light"
                  disabled={currentPage <= 1 || isPending}
                  onClick={() => updateFilters({ page: currentPage - 1 })}
                  className="py-1.5 px-3 min-h-9 gap-1 text-caption cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline-light"
                  disabled={currentPage >= ordersData.totalPages || isPending}
                  onClick={() => updateFilters({ page: currentPage + 1 })}
                  className="py-1.5 px-3 min-h-9 gap-1 text-caption cursor-pointer"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      {dialogConfig && (
        <AlertDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onConfirm={dialogConfig.onConfirm}
          title={dialogConfig.title}
          description={dialogConfig.description}
          confirmText={dialogConfig.confirmText}
          variant={dialogConfig.variant}
          isPending={isPending}
        />
      )}
    </div>
  )
}
