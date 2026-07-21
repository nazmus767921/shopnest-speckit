import React from "react"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { getCachedMerchantById } from "@/lib/cache/merchants"
import { OrdersLookupForm } from "@/components/storefront/pages/OrdersLookupForm"
import { CustomerOrdersList } from "@/components/storefront/pages/CustomerOrdersList"
import type { Metadata } from "next"

type Props = {
  params: Promise<{ subdomain: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const merchantName = headersList.get("x-merchant-name") || "Boutique Store"
  return {
    title: `Order Tracking — ${merchantName}`,
  }
}

import { Suspense } from "react"

export default function OrdersPage({ params }: Props) {
  return (
    <Suspense fallback={<OrdersPageSkeleton />}>
      <OrdersPageContent params={params} />
    </Suspense>
  )
}

async function OrdersPageContent({ params }: Props) {
  const { subdomain } = await params
  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id")

  if (!merchantId) {
    notFound()
  }

  // Load merchant info from database to confirm existence
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
  const customerEmail = session?.user?.email || ""

  return (
    <div className="py-6">
      {isLoggedIn ? (
        <CustomerOrdersList
          subdomain={subdomain}
          merchantId={merchantId}
          isAnonymousUser={isAnonymousUser}
          customerEmail={customerEmail}
        />
      ) : (
        <OrdersLookupForm
          merchantId={merchantId}
          merchantName={merchant.name}
        />
      )}
    </div>
  )
}

function OrdersPageSkeleton() {
  return (
    <div className="py-6 animate-pulse">
      <div className="bg-canvas-light border border-hairline-light rounded-lg p-6 h-64 w-full" />
    </div>
  )
}

