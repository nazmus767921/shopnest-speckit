import React from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getOrders } from "@/db/queries/orders"
import { OrdersClient } from "./components/orders-client"
import { redirect } from "next/navigation"

type Props = {
  searchParams: Promise<{
    status?: string
    search?: string
    page?: string
  }>
}

import { Suspense } from "react"

export default function DashboardOrdersPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <OrdersPageContent searchParams={searchParams} />
    </Suspense>
  )
}

async function OrdersPageContent({ searchParams }: Props) {
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

  const resolvedSearchParams = await searchParams
  const status = resolvedSearchParams.status || "all"
  const search = resolvedSearchParams.search || ""
  const page = parseInt(resolvedSearchParams.page || "1", 10)

  const ordersData = await getOrders({
    merchantId: merchant.id,
    status,
    search,
    page,
    limit: 20,
  })

  return <OrdersClient initialData={ordersData} merchantId={merchant.id} />
}

function OrdersSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="pb-2 border-b border-hairline-light">
        <div className="h-8 w-48 bg-shade-30 rounded-full" />
        <div className="h-4 w-64 bg-shade-30 rounded-full mt-2" />
      </div>
      
      {/* Table Skeleton */}
      <div className="bg-canvas-light border border-hairline-light rounded-lg p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="h-10 w-64 bg-shade-20 rounded-md" />
          <div className="h-10 w-32 bg-shade-20 rounded-md" />
        </div>
        <div className="h-64 bg-shade-20 rounded-lg w-full" />
      </div>
    </div>
  )
}

