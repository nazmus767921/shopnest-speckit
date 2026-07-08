import React, { Suspense } from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getMenus } from "@/db/queries/navigation"
import { getPages } from "@/db/queries/pages"
import { getCategories } from "@/db/queries/categories"
import { getProducts } from "@/db/queries/products"
import { NavigationClient } from "./components/navigation-client"

export const metadata = {
  title: "Navigation — ShopNest Dashboard",
  description: "Configure your storefront navigation menus.",
}

export default function NavigationPage() {
  return (
    <Suspense fallback={<NavigationSkeleton />}>
      <NavigationPageContent />
    </Suspense>
  )
}

async function NavigationPageContent() {
  const session = await auth.api.getSession({ headers: await headers() })
  const merchant = session ? await getMerchantByOwnerId(session.user.id) : null

  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-shade-50">Merchant account not found.</p>
      </div>
    )
  }

  const menus = await getMenus(merchant.id)
  const pages = await getPages(merchant.id)
  const categories = await getCategories(merchant.id)
  const products = await getProducts(merchant.id)

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="pb-2 border-b border-hairline-light">
        <h1 className="font-display text-heading-xl tracking-tight text-ink font-semibold leading-none">
          Navigation
        </h1>
        <p className="text-caption text-shade-50 font-light mt-1">
          Create and manage menus and nested links for your storefront navigation.
        </p>
      </div>

      <NavigationClient
        merchantId={merchant.id}
        initialMenus={menus}
        pages={pages.map(p => ({ id: p.id, title: p.title, slug: p.slug }))}
        categories={categories.map(c => ({ id: c.id, name: c.name, slug: c.slug }))}
        products={products.map(p => ({ id: p.id, name: p.name, slug: p.slug }))}
      />
    </div>
  )
}

function NavigationSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div className="pb-2 border-b border-hairline-light">
        <div className="h-8 w-48 bg-shade-30 rounded-full" />
        <div className="h-4 w-64 bg-shade-30 rounded-full mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-canvas-light border border-hairline-light rounded-lg p-6 h-64" />
        <div className="md:col-span-2 bg-canvas-light border border-hairline-light rounded-lg p-6 h-64" />
      </div>
    </div>
  )
}
