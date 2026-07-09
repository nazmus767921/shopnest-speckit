import React from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getCategories } from "@/db/queries/categories"
import { CategoriesClient } from "./components/CategoriesClient"
import { Suspense } from "react"

export const metadata = {
  title: "Categories — ShopNest Dashboard",
  description: "Create and manage category collections for your boutique storefront.",
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <CategoriesPageContent />
    </Suspense>
  )
}

async function CategoriesPageContent() {
  const session = await auth.api.getSession({ headers: await headers() })
  const merchant = session ? await getMerchantByOwnerId(session.user.id) : null

  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-64 text-foreground">
        <p className="text-muted-foreground">Merchant account not found.</p>
      </div>
    )
  }

  const initialCategories = await getCategories(merchant.id)

  return (
    <div className="flex flex-col gap-8 animate-fade-in text-foreground">
      {/* Page Header */}
      <div className="pb-2 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight text-foreground leading-none">
          Category Management
        </h1>
        <p className="text-sm text-muted-foreground font-light mt-1">
          Organize your clothing and products into collections for dynamic storefront presentation.
        </p>
      </div>

      <CategoriesClient
        initialCategories={initialCategories}
        merchantId={merchant.id}
        plan={merchant.plan}
      />
    </div>
  )
}

function CategoriesSkeleton() {
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
