import React from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getFlashSales } from "@/db/queries/flash-sales"
import { getProducts } from "@/db/queries/products"
import { FlashSalesClient } from "./components/FlashSalesClient"
import { Suspense } from "react"

export const metadata = {
  title: "Flash Sales — ShopNest Dashboard",
  description: "Launch and manage promotional flash sales on your products.",
}

export default function FlashSalesPage() {
  return (
    <Suspense fallback={<FlashSalesSkeleton />}>
      <FlashSalesPageContent />
    </Suspense>
  )
}

async function FlashSalesPageContent() {
  const session = await auth.api.getSession({ headers: await headers() })
  const merchant = session ? await getMerchantByOwnerId(session.user.id) : null

  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-64 text-foreground">
        <p className="text-muted-foreground">Merchant account not found.</p>
      </div>
    )
  }

  const initialFlashSales = await getFlashSales(merchant.id)
  const products = await getProducts(merchant.id)

  return (
    <div className="flex flex-col gap-8 animate-fade-in text-foreground">
      {/* Page Header */}
      <div className="pb-2 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight text-foreground leading-none">
          Flash Sales Management
        </h1>
        <p className="text-sm text-muted-foreground font-light mt-1">
          Schedule and manage time-limited discounts and stock caps on your products.
        </p>
      </div>

      <FlashSalesClient
        initialFlashSales={initialFlashSales as any}
        products={products as any}
        merchantId={merchant.id}
      />
    </div>
  )
}

function FlashSalesSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse text-foreground">
      <div className="pb-2 border-b border-border">
        <div className="h-8 w-48 bg-muted rounded-full" />
        <div className="h-4 w-64 bg-muted rounded-full mt-2" />
      </div>
      <div className="bg-card border border-border rounded-xl p-6 h-64 w-full" />
    </div>
  )
}
