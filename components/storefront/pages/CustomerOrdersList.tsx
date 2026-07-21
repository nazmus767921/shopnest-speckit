"use client"

import React from "react"
import Link from "next/link"
import { useCustomerOrders } from "@/hooks/use-customer-orders"
import { StatusBadge } from "@/components/storefront/primitives/StatusBadge"
import { Card, Button } from "@/components/ui"
import { formatTaka } from "@/lib/utils"
import { authClient } from "@/lib/auth/auth-client"
import { useRouter } from "next/navigation"
import { PackageIcon, LogOutIcon, ArrowRightIcon, Loader2Icon, ClipboardListIcon } from "@/lib/icons";


interface Props {
  subdomain: string
  merchantId: string
  isAnonymousUser: boolean
  customerEmail: string
}

export function CustomerOrdersList({ subdomain, merchantId, isAnonymousUser, customerEmail }: Props) {
  const router = useRouter()
  const { data: ordersList, isLoading, error, refetch } = useCustomerOrders()

  const handleLogout = async () => {
    try {
      await authClient.signOut()
      router.refresh()
    } catch (err) {
      console.error("Failed to sign out:", err)
    }
  }

  const getCleanPhone = (email: string) => {
    if (email.endsWith("@guest.shopnest.com.bd")) {
      return email.split("@")[0]
    }
    return email
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
        <span className="text-caption text-shade-50">Loading your orders...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8 text-center border border-red-200 bg-red-50 text-red-700 max-w-lg mx-auto flex flex-col gap-4">
        <h3 className="text-heading-md font-bold">Failed to load orders</h3>
        <p className="text-caption">{error instanceof Error ? error.message : "An error occurred."}</p>
        <Button variant="primary" onClick={() => refetch()} className="self-center">
          Try Again
        </Button>
      </Card>
    )
  }

  const orders = ordersList || []

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto animate-fade-in">
      {/* Customer Session Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-hairline-light pb-6">
        <div className="flex flex-col gap-1">
          <span className="text-eyebrow-cap font-semibold text-shade-50 uppercase tracking-widest">
            {isAnonymousUser ? "Guest Tracking Session" : "Registered Account"}
          </span>
          <h2 className="text-heading-xl font-bold text-ink">
            {isAnonymousUser ? `Phone: ${getCleanPhone(customerEmail)}` : customerEmail}
          </h2>
        </div>

        <Button
          variant="outline-light"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2 text-caption font-semibold"
        >
          <LogOutIcon className="h-4 w-4" />
          <span>Exit Session</span>
        </Button>
      </div>

      {orders.length === 0 ? (
        /* Empty State */
        <Card variant="default" className="border border-hairline-light p-12 flex flex-col items-center justify-center text-center gap-6 min-h-64 bg-canvas-light max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-pistachio-10 flex items-center justify-center text-ink border border-hairline-light">
            <ClipboardListIcon className="h-8 w-8 stroke-[1.5]" />
          </div>
          <div className="flex flex-col gap-2 max-w-sm">
            <h2 className="text-heading-xl font-medium text-ink">
              No Orders Found
            </h2>
            <p className="text-body-md text-shade-50">
              We couldn't find any orders placed under this account.
            </p>
          </div>
          <Button asChild variant="primary" className="font-semibold">
            <Link href="/">Browse Products</Link>
          </Button>
        </Card>
      ) : (
        /* Orders List */
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const formattedCode = `#${order.id.substring(0, 8).toUpperCase()}`
            const dateStr = new Date(order.createdAt).toLocaleDateString("en-BD", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
            
            // Get a preview text of order items
            const itemsPreview = order.items
              ? order.items.map((i: any) => `${i.productName} (×${i.quantity})`).join(", ")
              : ""

            return (
              <Card
                key={order.id}
                variant="default"
                className="p-6 bg-canvas-light border border-hairline-light hover:border-shade-40 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
              >
                <div className="flex flex-col gap-2 grow">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-body-strong font-bold text-ink">
                      {formattedCode}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="text-xs text-shade-40">
                    Placed on {dateStr}
                  </div>
                  <div className="text-caption text-shade-60 line-clamp-1 max-w-xl">
                    {itemsPreview}
                  </div>
                </div>

                <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto border-t sm:border-t-0 border-hairline-light/50 pt-4 sm:pt-0 gap-2 shrink-0">
                  <div className="flex flex-col sm:items-end">
                    <span className="text-xs text-shade-40">Amount</span>
                    <span className="font-mono text-heading-md font-bold text-ink">
                      {formatTaka(order.totalPaisa)}
                    </span>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-caption font-semibold flex items-center gap-1.5 hover:text-primary p-0 h-auto"
                  >
                    <Link href={`/orders/${order.id}`}>
                      <span>Details</span>
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
