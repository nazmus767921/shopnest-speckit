import React from "react"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth/auth"
import { getCachedMerchantById } from "@/lib/cache/merchants"
import { fetchCustomerOrderDetails } from "../actions"
import { CustomerOrderDetailClient } from "@/components/storefront/CustomerOrderDetailClient"
import { Card, Button } from "@/components/ui"
import { AlertCircle, ArrowLeft } from "lucide-react"
import type { Metadata } from "next"

type Props = {
  params: Promise<{ subdomain: string; id: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const merchantName = headersList.get("x-merchant-name") || "Boutique Store"
  return {
    title: `Order Status — ${merchantName}`,
  }
}

import { Suspense } from "react"

export default function OrderDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<OrderDetailSkeleton />}>
      <OrderDetailPageContent params={params} />
    </Suspense>
  )
}

async function OrderDetailPageContent({ params }: Props) {
  const { subdomain, id: orderId } = await params
  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id")

  if (!merchantId) {
    notFound()
  }

  // Load merchant info from database
  const merchant = await getCachedMerchantById(merchantId)
  if (!merchant) {
    notFound()
  }

  // Resolve Better Auth session server-side
  const session = await auth.api.getSession({
    headers: headersList,
  })

  // Determine user login status
  const isLoggedIn = !!session?.user
  const isAnonymousUser = session?.user?.email?.endsWith("@guest.shopnest.com.bd") || false

  // Fetch order details securely
  let order = null
  let errorMessage = ""

  if (!isLoggedIn) {
    errorMessage = "You must be signed in to view this order."
  } else {
    try {
      order = await fetchCustomerOrderDetails(orderId)
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : "Access denied or order not found."
    }
  }

  if (errorMessage || !order) {
    return (
      <div className="max-w-md mx-auto py-12 animate-fade-in">
        <Card variant="default" className="p-8 flex flex-col items-center justify-center text-center gap-6 bg-canvas-light border border-hairline-light">
          <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-700">
            <AlertCircle className="h-8 w-8 stroke-[1.5]" />
          </div>
          <div className="flex flex-col gap-2 max-w-sm">
            <h2 className="text-heading-xl font-medium text-ink">
              Access Denied
            </h2>
            <p className="text-body-md text-shade-50">
              {errorMessage || "You do not have permission to view this order details."}
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <Button as={Link} href={`/orders`} variant="primary" className="w-full font-semibold flex items-center justify-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Go to Orders Tracking</span>
            </Button>
            <Button as={Link} href="/" variant="outline-light" className="w-full font-medium">
              Back to Storefront
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <CustomerOrderDetailClient
      order={order}
      isAnonymousUser={isAnonymousUser}
      subdomain={subdomain}
    />
  )
}

function OrderDetailSkeleton() {
  return (
    <div className="max-w-md mx-auto py-12 animate-pulse">
      <div className="bg-canvas-light border border-hairline-light rounded-lg p-8 h-96 w-full" />
    </div>
  )
}

