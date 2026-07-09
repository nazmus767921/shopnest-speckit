"use client"

import React from "react"
import Link from "next/link"
import { PackageOpen } from "lucide-react"
import { Card } from "@/components/ui"
import { ProductCard } from "@/components/storefront/ProductCard"
import { ProductFilters } from "@/components/storefront/ProductFilters"
import { ProductGrid } from "@/components/storefront/shared/ProductGrid"
import { type PLPProps } from "../types"
import { useSearchParams } from "next/navigation"

export function GeneralPLP({
  store,
  products,
  categories,
  activeFilters,
  pagination
}: PLPProps) {
  const searchParams = useSearchParams()
  const search = searchParams.get("search")
  const categoryId = searchParams.get("category")
  const price = searchParams.get("price")
  const color = searchParams.get("color")
  const size = searchParams.get("size")
  const page = pagination.currentPage

  const buildPageUrl = (pageNum: number) => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (categoryId) params.set("category", categoryId)
    if (price) params.set("price", price)
    if (color) params.set("color", color)
    if (size) params.set("size", size)
    params.set("page", String(pageNum))
    return `?${params.toString()}`
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in px-2">
      {/* Page Title */}
      <div className="flex flex-col gap-1 border-b border-[var(--color-hairline-light)] pb-6 mt-4">
        <h1 className="text-storefront-display-lg font-bold text-[var(--color-ink)] uppercase tracking-tight leading-none">
          All Products
        </h1>
        <p className="text-storefront-body-md text-[var(--color-shade-50)]">
          Browse through {store.name}'s boutique collection.
        </p>
      </div>

      {/* Search Input Bar (Server-side Form) */}
      <div className="w-full flex justify-between items-center gap-4 bg-[var(--color-canvas-light)] p-4 rounded-[var(--radius-md)] border border-[var(--color-hairline-light)]">
        <form method="GET" className="w-full flex gap-3 max-w-xl">
          <input
            name="search"
            defaultValue={search || ""}
            placeholder="Search products..."
            className="input-storefront-text grow bg-[var(--color-surface-secondary)] text-[var(--color-ink)]"
          />
          {categoryId && <input type="hidden" name="category" value={categoryId} />}
          {price && <input type="hidden" name="price" value={price} />}
          {color && <input type="hidden" name="color" value={color} />}
          {size && <input type="hidden" name="size" value={size} />}
          <button type="submit" className="btn-storefront-primary px-6 border-none">
            Search
          </button>
        </form>

        {search && (
          <Link
            href="/products"
            className="text-storefront-caption font-bold text-red-555 uppercase tracking-wider hover:underline"
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
          {products.length === 0 ? (
            /* Empty State */
            <Card variant="default" className="border border-[var(--color-hairline-light)] p-12 flex flex-col items-center justify-center text-center gap-6 min-h-64 bg-[var(--color-canvas-light)] w-full rounded-[var(--radius-md)]">
              <div className="w-16 h-16 rounded-[var(--radius-pill)] bg-[var(--color-surface-secondary)] flex items-center justify-center text-[var(--color-ink)] border border-[var(--color-hairline-light)]">
                <PackageOpen className="h-8 w-8 stroke-[1.5]" />
              </div>
              <div className="flex flex-col gap-2 max-w-sm">
                <h2 className="text-storefront-heading-md font-bold text-[var(--color-ink)]">
                  No Products Found
                </h2>
                <p className="text-storefront-body-md text-[var(--color-shade-50)]">
                  No products matched your search or selected filters. Try resetting the filters.
                </p>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-8">
              <ProductGrid
                products={products}
                columns={{ mobile: 1, sm: 2, md: 3, lg: 3 }}
                renderCard={(product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    subdomain={store.subdomain}
                    merchantId={store.id}
                  />
                )}
              />

              {/* Numbered Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8 border-t border-[var(--color-hairline-light)] pt-6">
                  {/* Previous */}
                  <Link
                    href={buildPageUrl(page - 1)}
                    className={`px-4 py-2 rounded-[var(--radius-sm)] border text-xs font-semibold transition-all select-none ${
                      page <= 1
                        ? "pointer-events-none opacity-40 border-[var(--color-hairline-light)] bg-[var(--color-surface-secondary)] text-[var(--color-shade-40)]"
                        : "border-[var(--color-hairline-light)] hover:border-[var(--color-ink)] hover:bg-[var(--color-surface-secondary)] cursor-pointer text-[var(--color-ink)]"
                    }`}
                  >
                    Previous
                  </Link>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: pagination.totalPages }).map((_, i) => {
                    const pageNum = i + 1
                    const isActive = pageNum === page
                    return (
                      <Link
                        key={pageNum}
                        href={buildPageUrl(pageNum)}
                        className={`h-9 w-9 flex items-center justify-center rounded-[var(--radius-sm)] border text-xs font-semibold transition-all select-none ${
                          isActive
                            ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)]"
                            : "border-[var(--color-hairline-light)] hover:border-[var(--color-ink)] hover:bg-[var(--color-surface-secondary)] cursor-pointer text-[var(--color-ink)]"
                        }`}
                      >
                        {pageNum}
                      </Link>
                    )
                  })}

                  {/* Next */}
                  <Link
                    href={buildPageUrl(page + 1)}
                    className={`px-4 py-2 rounded-[var(--radius-sm)] border text-xs font-semibold transition-all select-none ${
                      page >= pagination.totalPages
                        ? "pointer-events-none opacity-40 border-[var(--color-hairline-light)] bg-[var(--color-surface-secondary)] text-[var(--color-shade-40)]"
                        : "border-[var(--color-hairline-light)] hover:border-[var(--color-ink)] hover:bg-[var(--color-surface-secondary)] cursor-pointer text-[var(--color-ink)]"
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
