import React from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getProducts } from "@/db/queries/products"
import { ProductsClient } from "./components/ProductsClient"
import { redirect } from "next/navigation"
import { getCachedMerchantPlan } from "@/lib/cache/plans"
import { Suspense } from "react"

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ProductsPageContent />
    </Suspense>
  )
}

async function ProductsPageContent() {
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

  const initialProducts = await getProducts(merchant.id)

  const plan = await getCachedMerchantPlan(merchant.id)
  const maxProducts = plan?.features.max_products ?? null
  const limitReached = maxProducts !== null && initialProducts.length >= maxProducts

  const formattedProducts = initialProducts.map((p) => ({
    ...p,
    price: p.pricePaisa / 100,
    compareAtPrice: p.compareAtPricePaisa ? p.compareAtPricePaisa / 100 : null,
  }))

  const headersList = await headers()
  const host = headersList.get("host") || "shopnest.com.bd"
  const protocol = host.includes("localhost") ? "http:" : "https:"
  const storefrontBaseUrl = `${protocol}//${merchant.subdomain}.${host}`

  return (
    <ProductsClient
      merchantId={merchant.id}
      storefrontBaseUrl={storefrontBaseUrl}
      initialProducts={formattedProducts}
      limitReached={limitReached}
    />
  )
}

function ProductsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse text-foreground">
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <div className="h-8 w-48 bg-muted rounded-full" />
        <div className="h-10 w-32 bg-muted rounded-full" />
      </div>
      <div className="h-64 bg-muted rounded-xl w-full" />
    </div>
  )
}
