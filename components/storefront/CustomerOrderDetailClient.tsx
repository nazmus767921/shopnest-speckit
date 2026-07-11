"use client"

import React from "react"
import Link from "next/link"
import { StatusBadge } from "./StatusBadge"
import { PromoteAccountCard } from "./PromoteAccountCard"
import { Card, Button } from "@/components/ui"
import { formatTaka } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import { ArrowLeftIcon, CheckIcon, MapPinIcon, PhoneIcon, UserIcon, CalendarIcon, ReceiptIcon, AlertTriangleIcon, ImageIcon, ShoppingBagIcon } from "@/lib/icons";


interface Props {
  order: any
  isAnonymousUser: boolean
  subdomain: string
}

export function CustomerOrderDetailClient({ order, isAnonymousUser, subdomain }: Props) {
  const formattedCode = `#${order.id.substring(0, 8).toUpperCase()}`
  const dateStr = new Date(order.createdAt).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })

  // Define steps for visual tracking
  const steps = [
    { key: "pending_payment", label: "Pending Payment" },
    { key: "processing", label: "Processing" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" }
  ]

  const currentStepIndex = steps.findIndex(s => s.key === order.status)
  const isCancelled = order.status === "cancelled"
  const isReturned = order.status === "returned"

  // Helper to resolve public URL for product images
  const getProductImageUrl = (item: any) => {
    const images = item.product?.images || []
    if (images.length > 0 && images[0].storagePath) {
      return supabase.storage.from("product-images").getPublicUrl(images[0].storagePath).data.publicUrl
    }
    return null
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-fade-in pb-16">
      {/* Back Link & Header */}
      <div className="flex flex-col gap-3">
        <Link
          href={`/orders`}
          className="inline-flex items-center gap-1.5 text-caption text-shade-60 hover:text-ink font-semibold transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to Orders</span>
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-hairline-light pb-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-heading-xl font-bold text-ink flex items-center gap-3">
              <span>Order {formattedCode}</span>
              <StatusBadge status={order.status} />
            </h1>
            <div className="flex items-center gap-2 text-xs text-shade-50 font-medium">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Placed on {dateStr}</span>
            </div>
          </div>
          <div className="font-mono text-heading-xl font-bold text-ink self-start sm:self-auto">
            {formatTaka(order.totalPaisa)}
          </div>
        </div>
      </div>

      {/* Visual Status Tracker Timeline */}
      {!isCancelled && !isReturned ? (
        <Card variant="default" className="p-8 bg-canvas-light border border-hairline-light">
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 sm:gap-4">

            {/* Connecting Progress Line (desktop only) */}
            <div className="absolute top-5.25 left-6 right-6 h-0.5 bg-zinc-200 hidden sm:block -z-10" />
            <div
              className="absolute top-5.25 left-6 h-0.5 bg-emerald-600 hidden sm:block -z-10 transition-all duration-500"
              style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 95}%` }}
            />

            {/* Connecting Progress Line (mobile only) */}
            <div className="absolute left-5.25 top-6 bottom-6 w-0.5 bg-zinc-200 block sm:hidden -z-10" />
            <div
              className="absolute left-5.25 top-6 w-0.5 bg-emerald-600 block sm:hidden -z-10 transition-all duration-500"
              style={{ height: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 90}%` }}
            />

            {/* Timeline Steps */}
            {steps.map((step, idx) => {
              const isCompleted = idx < currentStepIndex
              const isActive = idx === currentStepIndex
              const isFuture = idx > currentStepIndex

              return (
                <div key={step.key} className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-2 grow">
                  {/* Step Circle */}
                  <div
                    className={`h-11 w-11 rounded-full flex items-center justify-center border-2 text-caption font-bold transition-all duration-300 ${isCompleted
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : isActive
                          ? "bg-canvas-light border-emerald-600 text-emerald-800 scale-105 animate-pulse"
                          : "bg-canvas-light border-zinc-200 text-shade-40"
                      }`}
                  >
                    {isCompleted ? (
                      <CheckIcon className="h-5 w-5 stroke-[2.5]" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="flex flex-col sm:items-center">
                    <span
                      className={`text-caption font-bold ${isActive
                          ? "text-emerald-800 font-semibold"
                          : isCompleted
                            ? "text-ink font-semibold"
                            : "text-shade-50"
                        }`}
                    >
                      {step.label}
                    </span>
                    {isActive && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold mt-1">
                        Active Step
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ) : isCancelled ? (
        /* Cancelled Banner */
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          <AlertTriangleIcon className="h-5 w-5 shrink-0" />
          <div className="text-caption">
            <p className="font-semibold">This order has been cancelled</p>
            <p className="text-red-600/80 text-xs mt-0.5">
              The transaction is closed and inventory stock has been restored to the merchant.
            </p>
          </div>
        </div>
      ) : (
        /* Returned Banner */
        <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl animate-fade-in">
          <AlertTriangleIcon className="h-5 w-5 shrink-0 text-orange-600" />
          <div className="text-caption">
            <p className="font-semibold text-orange-850">This order has been returned</p>
            <p className="text-orange-600/80 text-xs mt-0.5">
              The order was rejected or returned. Inventory stock has been restored to the merchant.
            </p>
          </div>
        </div>
      )}

      {/* Main Order Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left Side: Items & Details */}
        <div className="md:col-span-2 flex flex-col gap-6">

          {/* Order Items Card */}
          <Card variant="default" className="p-6 bg-canvas-light border border-hairline-light flex flex-col gap-4">
            <h3 className="text-body-strong font-bold text-ink uppercase tracking-wider pb-3 border-b border-hairline-light flex items-center gap-2">
              <ShoppingBagIcon className="h-4.5 w-4.5 text-shade-50" />
              <span>Order Items</span>
            </h3>

            <div className="flex flex-col gap-4">
              {order.items?.map((item: any) => {
                const imageUrl = getProductImageUrl(item)
                return (
                  <div key={item.id} className="flex gap-4 items-center">
                    {/* Item Thumbnail */}
                    <div className="w-14 h-18 bg-zinc-50 border border-hairline-light rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                      {imageUrl ? (
                        <img src={imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-shade-30" />
                      )}
                    </div>

                    <div className="grow">
                      <h4 className="text-body-strong font-semibold text-ink leading-tight">
                        {item.productName}
                      </h4>
                      <p className="text-xs text-shade-50 mt-1">
                        Quantity: <span className="font-semibold text-ink">{item.quantity}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-body-md font-bold text-ink">
                        {formatTaka(item.unitPricePaisa * item.quantity)}
                      </span>
                      <p className="text-[10px] text-shade-40 font-mono mt-0.5">
                        {formatTaka(item.unitPricePaisa)} each
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total Math Calculation */}
            <div className="border-t border-hairline-light/60 pt-4 mt-2 flex flex-col gap-2">
              <div className="flex justify-between text-xs text-shade-60">
                <span>Subtotal</span>
                <span className="font-mono">{formatTaka(order.totalPaisa - order.deliveryChargePaisa)}</span>
              </div>
              <div className="flex justify-between text-xs text-shade-60">
                <span>Delivery</span>
                {order.deliveryChargePaisa > 0 ? (
                  <span className="font-mono">{formatTaka(order.deliveryChargePaisa)}</span>
                ) : (
                  <span className="text-emerald-700 font-semibold uppercase">Free</span>
                )}
              </div>
              <div className="border-t border-hairline-light/40 pt-3 flex justify-between text-body-strong font-bold text-ink">
                <span>Total Amount</span>
                <span className="font-mono text-heading-md">{formatTaka(order.totalPaisa)}</span>
              </div>
            </div>
          </Card>

          {/* Guest Session Account Promotion */}
          {isAnonymousUser && (
            <PromoteAccountCard guestName={order.deliveryName} />
          )}
        </div>

        {/* Right Side: Delivery Address & Payment details */}
        <div className="flex flex-col gap-6">

          {/* Delivery Details Card */}
          <Card variant="default" className="p-6 bg-canvas-light border border-hairline-light flex flex-col gap-4">
            <h3 className="text-body-strong font-bold text-ink uppercase tracking-wider pb-3 border-b border-hairline-light flex items-center gap-2">
              <MapPinIcon className="h-4.5 w-4.5 text-shade-50" />
              <span>Fulfillment Details</span>
            </h3>

            <div className="flex flex-col gap-4 text-caption text-ink">
              <div className="flex gap-2.5 items-start">
                <UserIcon className="h-4.5 w-4.5 text-shade-40 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] uppercase font-semibold text-shade-40 tracking-wider">Recipient</div>
                  <div className="font-semibold mt-0.5">{order.deliveryName}</div>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <PhoneIcon className="h-4.5 w-4.5 text-shade-40 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] uppercase font-semibold text-shade-40 tracking-wider">PhoneIcon</div>
                  <div className="font-mono mt-0.5">{order.deliveryPhone}</div>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <MapPinIcon className="h-4.5 w-4.5 text-shade-40 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] uppercase font-semibold text-shade-40 tracking-wider">Address</div>
                  <div className="mt-0.5 leading-relaxed">{order.deliveryAddress}, {order.deliveryCity}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment details Card */}
          <Card variant="default" className="p-6 bg-canvas-light border border-hairline-light flex flex-col gap-4">
            <h3 className="text-body-strong font-bold text-ink uppercase tracking-wider pb-3 border-b border-hairline-light flex items-center gap-2">
              <ReceiptIcon className="h-4.5 w-4.5 text-shade-50" />
              <span>Payment Details</span>
            </h3>

            <div className="flex flex-col gap-3 text-caption text-ink">
              <div>
                <span className="text-[10px] uppercase font-semibold text-shade-40 tracking-wider">Method</span>
                <div className="font-semibold mt-0.5 uppercase">
                  {order.paymentConfirmation?.paymentMethod || "Manual Verification"}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-shade-40 tracking-wider">Transaction ID (TxID)</span>
                <div className="font-mono font-bold mt-0.5 bg-zinc-50 border border-hairline-light/50 py-1.5 px-2.5 rounded-lg text-primary self-start inline-block uppercase">
                  {order.paymentConfirmation?.transactionId || "N/A"}
                </div>
              </div>

              {order.paymentConfirmation?.confirmedAt && (
                <div>
                  <span className="text-[10px] uppercase font-semibold text-shade-40 tracking-wider">Confirmed At</span>
                  <div className="text-xs text-emerald-800 font-semibold mt-0.5">
                    {new Date(order.paymentConfirmation.confirmedAt).toLocaleDateString("en-BD", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}
