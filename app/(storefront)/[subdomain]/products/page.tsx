import React from "react"
import { headers } from "next/headers"
import { getFilteredPublishedProducts } from "@/db/queries/products"
import { getCategories } from "@/db/queries/categories"
import { ProductCard } from "@/components/storefront/ProductCard"
import { ProductFilters } from "@/components/storefront/ProductFilters"
import { Button } from "@/components/ui/primitives/Button"
import { Input } from "@/components/ui/primitives/Input"
import { Card } from "@/components/ui/layout/Card"
import { PackageOpen } from "lucide-react"
import Link from "next/link"

import { Suspense } from "react"
import { connection } from "next/server"

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
  await connection()
  const { subdomain } = await params
  const sParams = await searchParams
  
  const search = typeof sParams.search === "string" ? sParams.search : null
  const categoryId = typeof sParams.category === "string" ? sParams.category : null
  const price = typeof sParams.price === "string" ? sParams.price : null
  const color = typeof sParams.color === "string" ? sParams.color : null
  const size = typeof sParams.size === "string" ? sParams.size : null
  const page = typeof sParams.page === "string" ? parseInt(sParams.page) : 1

  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id") || ""
  const merchantName = headersList.get("x-merchant-name") || "Boutique Store"

  // Fetch categories and filtered products
  const categories = merchantId ? await getCategories(merchantId) : []
  const products = merchantId
    ? await getFilteredPublishedProducts(merchantId, { categoryId, search })
    : []

  let formattedProducts = products.map((p) => {
    // Build attributeOptionId → attribute name lookup for combination resolution
    const attrNameById: Record<string, string> = {}
    for (const attr of p.attributes ?? []) {
      for (const opt of attr.options ?? []) {
        attrNameById[opt.id] = attr.name
      }
    }
    return {
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
      attributes: (p.attributes ?? []).map((attr) => ({
        name: attr.name,
        displayType: attr.displayType as "swatch" | "dropdown" | "radio",
        options: (attr.options ?? []).map((opt) => ({
          value: opt.value,
          label: opt.label,
          swatchColor: opt.swatchColor ?? undefined,
        })),
      })),
      variants: (p.variants ?? []).map((v) => ({
        id: v.id,
        sku: v.sku,
        pricePaisa: v.pricePaisa,
        stockCount: v.stockCount,
        isActive: v.isActive,
        attributeCombination: Object.fromEntries(
          (v.attributeLinks ?? []).map((link) => [
            attrNameById[link.attributeOptionId] ?? "",
            link.attributeOption.value,
          ])
        ),
      })),
    }
  })


  // Server-side filter by price range in memory
  if (price) {
    formattedProducts = formattedProducts.filter((product) => {
      const priceTaka = product.pricePaisa / 100
      if (price === "under-1000") return priceTaka < 1000
      if (price === "1000-2000") return priceTaka >= 1000 && priceTaka <= 2000
      if (price === "2000-5000") return priceTaka >= 2000 && priceTaka <= 5000
      if (price === "over-5000") return priceTaka > 5000
      return true
    })
  }

  // Pagination bounds
  const limit = 6
  const totalCount = formattedProducts.length
  const totalPages = Math.ceil(totalCount / limit)
  const paginatedProducts = formattedProducts.slice((page - 1) * limit, page * limit)

  // Construct page URLs helper
  const buildPageUrl = (pageNum: number) => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (categoryId) params.set("category", categoryId)
    if (price) params.set("price", price)
    if (color) params.set("color", color)
    if (size) params.set("size", size)
    params.set("page", String(pageNum))
    return `?${params.toString()}`
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in px-2">
      {/* Page Title */}
      <div className="flex flex-col gap-1 border-b border-hairline-light pb-6 mt-4">
        <h1 className="text-storefront-display-lg font-bold text-ink uppercase tracking-tight leading-none">
          All Products
        </h1>
        <p className="text-storefront-body-md text-shade-50">
          Browse through {merchantName}'s boutique collection.
        </p>
      </div>

      {/* Search Input Bar (Server-side Form) */}
      <div className="w-full flex justify-between items-center gap-4 bg-white p-4 rounded-md border border-hairline-light">
        <form method="GET" className="w-full flex gap-3 max-w-xl">
          <Input
            name="search"
            defaultValue={search || ""}
            placeholder="Search products..."
            className="input-storefront-text grow bg-[#F2F0F1]"
          />
          {categoryId && <input type="hidden" name="category" value={categoryId} />}
          {price && <input type="hidden" name="price" value={price} />}
          {color && <input type="hidden" name="color" value={color} />}
          {size && <input type="hidden" name="size" value={size} />}
          <Button type="submit" variant="primary" size="md" className="btn-storefront-primary px-6 rounded-md">
            Search
          </Button>
        </form>

        {search && (
          <Link
            href="/products"
            className="text-storefront-caption font-bold text-red-500 uppercase tracking-wider hover:underline"
          >
            Clear Search
          </Link>
        )}
      </div>

      {/* Two Column Layout: Sidebar + Grid */}
      <div className="flex flex-col md:flex-row gap-8 items-start w-full">
        {/* Accordion Filter Sidebar */}
        <ProductFilters
          categories={categories}
          activeCategory={categoryId}
          activePrice={price}
          activeColor={color}
          activeSize={size}
        />

        {/* Products Grid */}
        <div className="grow w-full">
          {paginatedProducts.length === 0 ? (
            /* Empty State */
            <Card variant="default" className="border border-hairline-light p-12 flex flex-col items-center justify-center text-center gap-6 min-h-64 bg-white w-full rounded-md">
              <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-ink border border-hairline-light">
                <PackageOpen className="h-8 w-8 stroke-[1.5]" />
              </div>
              <div className="flex flex-col gap-2 max-w-sm">
                <h2 className="text-storefront-heading-md font-bold text-ink">
                  No Products Found
                </h2>
                <p className="text-storefront-body-md text-shade-50">
                  No products matched your search or selected filters. Try resetting the filters.
                </p>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    subdomain={subdomain}
                    merchantId={merchantId}
                  />
                ))}
              </div>

              {/* Numbered Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8 border-t border-hairline-light pt-6">
                  {/* Previous */}
                  <Link
                    href={buildPageUrl(page - 1)}
                    className={`px-4 py-2 rounded-md border text-xs font-semibold transition-all select-none ${
                      page <= 1
                        ? "pointer-events-none opacity-40 border-hairline-light bg-zinc-50 text-shade-40"
                        : "border-hairline-light hover:border-ink hover:bg-zinc-50 cursor-pointer text-ink"
                    }`}
                  >
                    Previous
                  </Link>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1
                    const isActive = pageNum === page
                    return (
                      <Link
                        key={pageNum}
                        href={buildPageUrl(pageNum)}
                        className={`h-9 w-9 flex items-center justify-center rounded-md border text-xs font-semibold transition-all select-none ${
                          isActive
                            ? "bg-primary text-on-primary border-primary"
                            : "border-hairline-light hover:border-ink hover:bg-zinc-50 cursor-pointer text-ink"
                        }`}
                      >
                        {pageNum}
                      </Link>
                    )
                  })}

                  {/* Next */}
                  <Link
                    href={buildPageUrl(page + 1)}
                    className={`px-4 py-2 rounded-md border text-xs font-semibold transition-all select-none ${
                      page >= totalPages
                        ? "pointer-events-none opacity-40 border-hairline-light bg-zinc-50 text-shade-40"
                        : "border-hairline-light hover:border-ink hover:bg-zinc-50 cursor-pointer text-ink"
                    }`}
                  >
                    Next
                  </Link>
                </div>
              )}
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
      <div className="h-16 w-full bg-shade-30 rounded-md" />

      {/* Two Column Layout Skeleton */}
      <div className="flex flex-col md:flex-row gap-8 items-start w-full">
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-3">
          <div className="h-6 w-24 bg-shade-30 rounded-full" />
          <div className="h-10 w-full bg-shade-30 rounded-full" />
        </div>
        <div className="grow w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="h-64 bg-shade-30 rounded-md" />
            <div className="h-64 bg-shade-30 rounded-md" />
            <div className="h-64 bg-shade-30 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}
