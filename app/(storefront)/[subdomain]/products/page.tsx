import React from "react"
import { headers } from "next/headers"
import { getFilteredPublishedProducts } from "@/db/queries/products"
import { getCategories } from "@/db/queries/categories"
import { ProductCard } from "@/components/storefront/ProductCard"
import { Button } from "@/components/ui/primitives/Button"
import { Input } from "@/components/ui/primitives/Input"
import { Card } from "@/components/ui/layout/Card"
import { PackageOpen, Filter } from "lucide-react"
import Link from "next/link"

import { Suspense } from "react"

export const instant = false

type Props = {
  params: Promise<{ subdomain: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default function ProductsPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ProductsPageContent params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function ProductsPageContent({ params, searchParams }: Props) {
  const { subdomain } = await params
  const sParams = await searchParams
  const search = typeof sParams.search === "string" ? sParams.search : null
  const categoryId = typeof sParams.category === "string" ? sParams.category : null

  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id") || ""
  const merchantName = headersList.get("x-merchant-name") || "Boutique Store"

  // Fetch categories and filtered products
  const categories = merchantId ? await getCategories(merchantId) : []
  const products = merchantId
    ? await getFilteredPublishedProducts(merchantId, { categoryId, search })
    : []

  const formattedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    pricePaisa: p.pricePaisa,
    stockCount: p.stockCount,
    lowStockThreshold: p.lowStockThreshold,
    images: p.images.map((img) => ({ storagePath: img.storagePath })),
    category: p.category ? { id: p.category.id, name: p.category.name } : null,
    promotions: p.promotions.map((pr) => ({ promotionType: pr.promotionType })),
  }))

  return (
    <div className="flex flex-col gap-8 animate-fade-in px-2">
      {/* Page Title */}
      <div className="flex flex-col gap-1 border-b border-hairline-light pb-6 mt-4">
        <h1 className="font-display text-heading-xl tracking-tight text-ink font-semibold uppercase leading-none">
          All Products
        </h1>
        <p className="text-caption text-shade-50 font-light">
          Browse through {merchantName}'s boutique collection.
        </p>
      </div>

      {/* Search Input Bar (Server-side Form) */}
      <div className="w-full flex justify-between items-center gap-4 bg-canvas-light p-4 rounded-2xl border border-hairline-light">
        <form method="GET" className="w-full flex gap-3 max-w-xl">
          <Input
            name="search"
            defaultValue={search || ""}
            placeholder="Search products..."
            className="bg-canvas-cream/40 border-hairline-light focus:border-ink grow"
          />
          {categoryId && <input type="hidden" name="category" value={categoryId} />}
          <Button type="submit" variant="primary" size="md">
            Search
          </Button>
        </form>

        {search && (
          <Link
            href={categoryId ? `?category=${categoryId}` : "/products"}
            className="text-micro font-bold text-red-500 uppercase tracking-wider hover:underline"
          >
            Clear Search
          </Link>
        )}
      </div>

      {/* Two Column Layout: Sidebar + Grid */}
      <div className="flex flex-col md:flex-row gap-8 items-start w-full">
        {/* Category Filter Sidebar / Horizontal Scrolling Category Bar on Mobile */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-ink">
            <Filter className="h-4 w-4 stroke-[2]" />
            <span className="text-micro font-bold uppercase tracking-wider">Collections</span>
          </div>

          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-3 md:pb-0 scrollbar-none select-none w-full border-b md:border-b-0 border-hairline-light">
            {/* All Items Link */}
            <Link
              href={search ? `?search=${encodeURIComponent(search)}` : "/products"}
              className={`px-4.5 py-2 md:py-2.5 rounded-full text-caption font-semibold transition-all shrink-0 cursor-pointer text-center ${
                !categoryId
                  ? "bg-primary text-on-primary"
                  : "bg-canvas-cream border border-hairline-light hover:border-shade-40 text-shade-60"
              }`}
            >
              All Items
            </Link>

            {/* Category Links */}
            {categories.map((cat) => {
              const isActive = categoryId === cat.id
              const queryParams = new URLSearchParams()
              queryParams.set("category", cat.id)
              if (search) queryParams.set("search", search)

              return (
                <Link
                  key={cat.id}
                  href={`?${queryParams.toString()}`}
                  className={`px-4.5 py-2 md:py-2.5 rounded-full text-caption font-semibold transition-all shrink-0 cursor-pointer text-center ${
                    isActive
                      ? "bg-primary text-on-primary"
                      : "bg-canvas-cream border border-hairline-light hover:border-shade-40 text-shade-60"
                  }`}
                >
                  {cat.name}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grow w-full">
          {formattedProducts.length === 0 ? (
            /* Empty State */
            <Card variant="default" className="border border-hairline-light p-12 flex flex-col items-center justify-center text-center gap-6 min-h-64 bg-canvas-light w-full">
              <div className="w-16 h-16 rounded-full bg-pistachio-10 flex items-center justify-center text-ink border border-hairline-light">
                <PackageOpen className="h-8 w-8 stroke-[1.5]" />
              </div>
              <div className="flex flex-col gap-2 max-w-sm">
                <h2 className="text-heading-xl font-medium text-ink">
                  No Products Found
                </h2>
                <p className="text-body-md text-shade-50">
                  No products matched your search or selected category filter. Try clearing filters or try a different search.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {formattedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  subdomain={subdomain}
                  merchantId={merchantId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductsPageSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse px-2">
      {/* Page Title Skeleton */}
      <div className="flex flex-col gap-2 border-b border-hairline-light pb-6 mt-4">
        <div className="h-8 w-48 bg-shade-30 rounded-full" />
        <div className="h-4 w-64 bg-shade-30 rounded-full" />
      </div>

      {/* Search Input Bar Skeleton */}
      <div className="h-16 w-full bg-shade-30 rounded-2xl" />

      {/* Two Column Layout Skeleton */}
      <div className="flex flex-col md:flex-row gap-8 items-start w-full">
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-3">
          <div className="h-6 w-24 bg-shade-30 rounded-full" />
          <div className="h-10 w-full bg-shade-30 rounded-full" />
        </div>
        <div className="grow w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="h-64 bg-shade-30 rounded-2xl" />
            <div className="h-64 bg-shade-30 rounded-2xl" />
            <div className="h-64 bg-shade-30 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
