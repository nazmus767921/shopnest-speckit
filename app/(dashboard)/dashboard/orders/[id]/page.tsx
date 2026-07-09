import React from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getOrderDetails } from "@/db/queries/orders"
import { StatusBadge } from "../components/StatusBadge"
import { OrderActions } from "../components/OrderActions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Calendar, Phone, MapPin, CreditCard, User, ShoppingBag, Copy, Check } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { db } from "@/db"
import { user } from "@/db/schema"
import { eq } from "drizzle-orm"
import { CopyButton } from "@/components/shared/CopyButton"
import { Suspense } from "react"
import { cn } from "@/lib/utils"

type Props = {
  params: Promise<{
    id: string
  }>
}

export default function OrderDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<OrderSkeleton />}>
      <OrderDetailPageContent params={params} />
    </Suspense>
  )
}

async function OrderDetailPageContent({ params }: Props) {
  const { id: orderId } = await params
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  const merchant = await getMerchantByOwnerId(session.user.id)
  if (!merchant) {
    redirect("/onboarding")
  }

  const order = await getOrderDetails(merchant.id, orderId)
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-foreground">
        <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
        <p className="text-sm text-muted-foreground mb-6 font-light">
          The order you are looking for does not exist or belongs to another store.
        </p>
        <Link href="/dashboard/orders">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    )
  }

  const formatTaka = (paisa: number) => {
    return `৳ ${(paisa / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // If confirmed, get user name who confirmed it
  let confirmedByUserName = ""
  if (order.paymentConfirmation?.confirmedBy) {
    const [confirmer] = await db
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, order.paymentConfirmation.confirmedBy))
    confirmedByUserName = confirmer?.name || "System"
  }

  const formatCompactDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const steps = [
    {
      label: "Placed",
      isCompleted: true,
      isActive: order.status === "pending_payment",
      time: order.createdAt,
    },
    {
      label: "Paid",
      isCompleted: order.status !== "pending_payment" && order.status !== "cancelled",
      isActive: order.status === "processing",
      time: order.paymentConfirmation?.confirmedAt || null,
    },
    {
      label: "Shipped",
      isCompleted: order.status === "shipped" || order.status === "delivered",
      isActive: order.status === "shipped",
      time: (order.status === "shipped" || order.status === "delivered") ? order.updatedAt : null,
    },
    {
      label: "Delivered",
      isCompleted: order.status === "delivered",
      isActive: order.status === "delivered",
      time: order.status === "delivered" ? order.updatedAt : null,
    },
  ]

  return (
    <div className="flex flex-col gap-6 text-foreground animate-fade-in select-text">
      {/* Back button and header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium self-start group cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Orders</span>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground leading-none">
                Order #{order.id.slice(0, 8)}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-muted-foreground font-light flex items-center gap-1.5 mt-1 font-sans">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Stepper Timeline */}
      <Card className="border border-border bg-card p-6 flex flex-col gap-4">
        <h3 className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
          Order Status Tracker
        </h3>

        <div className="flex flex-col md:flex-row md:items-center w-full gap-6 md:gap-2 mt-2">
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              {/* Step Node */}
              <div className="flex items-center gap-3 md:flex-col md:text-center md:flex-1">
                {/* Step Circle */}
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center border font-sans text-xs font-bold shrink-0 transition-all",
                  step.isCompleted
                    ? "bg-emerald-500/10 border-emerald-600 text-emerald-800 font-bold"
                    : step.isActive
                      ? "bg-card border-primary text-primary ring-2 ring-primary/10"
                      : "bg-muted/30 border-border text-muted-foreground"
                )}>
                  {step.isCompleted ? <Check className="h-4 w-4 text-emerald-600 stroke-[2.5px]" /> : idx + 1}
                </div>

                {/* Step labels */}
                <div className="flex flex-col md:items-center gap-0.5">
                  <span className={cn(
                    "text-sm font-semibold",
                    step.isCompleted ? "text-foreground font-bold" : step.isActive ? "text-primary font-bold" : "text-muted-foreground font-medium"
                  )}>
                    {step.label}
                  </span>
                  {step.time && (
                    <span className="text-[11px] text-muted-foreground font-light font-sans whitespace-nowrap">
                      {formatCompactDate(step.time)}
                    </span>
                  )}
                </div>
              </div>

              {/* Divider lines between steps (Desktop only) */}
              {idx < steps.length - 1 && (
                <div className={cn(
                  "hidden md:block h-[2.5px] grow transition-colors duration-300",
                  steps[idx + 1].isCompleted || steps[idx + 1].isActive
                    ? "bg-emerald-600"
                    : "bg-border"
                )} />
              )}
            </React.Fragment>
          ))}
        </div>

        {order.status === "cancelled" && (
          <div className="border border-destructive/20 bg-destructive/10 p-4 text-destructive text-sm font-medium flex items-center gap-2 rounded-lg mt-2">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            <span>This order has been cancelled and stock has been restored to the inventory.</span>
          </div>
        )}
      </Card>

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns on Desktop */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Action Panel */}
          {order.status !== "delivered" && order.status !== "cancelled" && (
            <Card className="border border-border bg-card p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                  Order Management Actions
                </span>
                <span className="text-sm text-muted-foreground font-light">
                  Review transaction IDs in details below, then update this order's processing state.
                </span>
              </div>
              <OrderActions orderId={order.id} status={order.status} />
            </Card>
          )}

          {/* Customer & Shipping Details */}
          <Card className="border border-border bg-card p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold border-b border-border/50 pb-2">
              Customer & Delivery Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex gap-3">
                <div className="p-2.5 bg-muted text-foreground rounded-lg self-start">
                  <User className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">Customer Name</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold">{order.deliveryName}</span>
                    <CopyButton text={order.deliveryName} />
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="p-2.5 bg-muted text-foreground rounded-lg self-start">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">Phone Number</span>
                  <div className="flex items-center gap-1.5">
                    <a href={`tel:${order.deliveryPhone}`} className="text-sm font-semibold hover:underline text-primary">
                      {order.deliveryPhone}
                    </a>
                    <CopyButton text={order.deliveryPhone} />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 md:col-span-2">
                <div className="p-2.5 bg-muted text-foreground rounded-lg self-start">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">Shipping Address</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground leading-relaxed">
                      {order.deliveryAddress}, {order.deliveryCity}
                    </span>
                    <CopyButton text={`${order.deliveryAddress}, ${order.deliveryCity}`} />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment & Transaction details */}
          <Card className="border border-border bg-card p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold border-b border-border/50 pb-2">
              Payment Information
            </h3>
            {order.paymentConfirmation ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex gap-3">
                  <div className="p-2.5 bg-muted text-foreground rounded-lg self-start">
                    <CreditCard className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">Payment Method</span>
                    {order.paymentConfirmation.paymentMethod === "cod" ? (
                      <span className="inline-flex items-center rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground uppercase tracking-wider self-start mt-0.5">
                        COD
                      </span>
                    ) : (
                      <span className="text-sm font-semibold capitalize text-foreground">
                        {order.paymentConfirmation.paymentMethod}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="p-2.5 bg-muted text-foreground rounded-lg self-start">
                    <Copy className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col gap-0.5 grow">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">Transaction ID</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-mono font-bold text-foreground break-all select-all selection:bg-emerald-500/10">
                        {order.paymentConfirmation.transactionId}
                      </span>
                      <CopyButton text={order.paymentConfirmation.transactionId} />
                    </div>
                  </div>
                </div>

                {order.paymentConfirmation.confirmedAt && (
                  <div className="md:col-span-2 border-t border-border/50 pt-4 mt-2 flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">
                      Payment confirmed on <span className="font-semibold">{formatDate(order.paymentConfirmation.confirmedAt)}</span> by <span className="font-semibold">{confirmedByUserName}</span>.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground p-4 bg-muted/30 border border-dashed border-border rounded-lg">
                <CreditCard className="h-5 w-5" />
                <span className="text-sm italic font-light">No payment details submitted by customer yet.</span>
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Column on Desktop: Order Items */}
        <div className="flex flex-col gap-6">
          <Card className="border border-border bg-card p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold border-b border-border/50 pb-2 flex items-center justify-between">
              <span>Items List</span>
              <span className="text-xs bg-muted text-foreground px-2.5 py-0.5 rounded-full font-sans font-bold">
                {order.items.reduce((sum, i) => sum + i.quantity, 0)} items
              </span>
            </h3>

            {/* List of items */}
            <div className="flex flex-col divide-y divide-border/50">
              {order.items.map((item) => {
                const thumbnail = item.product?.images?.[0]?.storagePath
                const imageUrl = thumbnail
                  ? supabase.storage.from("product-images").getPublicUrl(thumbnail).data.publicUrl
                  : null

                return (
                  <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="h-14 w-14 rounded-lg bg-muted/50 border border-border flex items-center justify-center overflow-hidden shrink-0">
                      {imageUrl ? (
                        <img src={imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                      ) : (
                        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 grow">
                      <span className="text-sm font-semibold line-clamp-1 text-foreground">{item.productName}</span>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {item.quantity} × {formatTaka(item.unitPricePaisa)}
                        </span>
                        <span className="font-mono font-semibold text-foreground">
                          {formatTaka(item.quantity * item.unitPricePaisa)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pricing totals summary */}
            <div className="border-t border-border/65 pt-4 flex flex-col gap-2 mt-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">{formatTaka(order.totalPaisa - order.deliveryChargePaisa)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Delivery</span>
                {order.deliveryChargePaisa > 0 ? (
                  <span className="font-mono">{formatTaka(order.deliveryChargePaisa)}</span>
                ) : (
                  <span className="text-emerald-600 font-semibold uppercase text-xs">Free</span>
                )}
              </div>
              {order.discountPaisa > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span className="font-mono">-{formatTaka(order.discountPaisa)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-foreground border-t border-border/40 pt-3 mt-1">
                <span>Total</span>
                <span className="font-mono text-base">{formatTaka(order.totalPaisa - order.discountPaisa)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function OrderSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse text-foreground">
      <div className="flex flex-col gap-4">
        <div className="h-6 w-32 bg-muted rounded-full" />
        <div className="h-10 w-64 bg-muted rounded-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="h-64 bg-card border border-border rounded-xl p-6 w-full" />
          <div className="h-48 bg-card border border-border rounded-xl p-6 w-full" />
        </div>
        <div className="h-96 bg-card border border-border rounded-xl p-6 w-full" />
      </div>
    </div>
  )
}
