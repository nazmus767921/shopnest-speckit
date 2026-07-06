"use client"

import React from "react"
import Link from "next/link"
import { PackageOpen } from "lucide-react"
import { Card } from "@/components/ui"
import { ProductFilters } from "@/components/storefront/ProductFilters"
import { ProductGrid } from "@/components/storefront/shared/ProductGrid"
import { FashionProductCard } from "./components/FashionProductCard"
import { type PLPProps } from "../types"
import { useSearchParams } from "next/navigation"

export function FashionPLP({
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
    <div className="flex flex-col gap-10 animate-fade-in px-4 md:px-8">
      {/* Page Title */}
      <div className="flex flex-col gap-2 border-b border-[var(--color-hairline-warm)] pb-8 mt-6">
        <span className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--color-shade-50)] font-sans">
          Boutique Catalog
        </span>
        <h1 className="font-display text-4xl md:text-5xl text-[var(--color-ink)] font-normal leading-none uppercase">
          Shop the Collection
        </h1>
        <p className="text-sm font-sans text-[var(--color-shade-40)] font-light mt-1">
          Explore refined silhouettes and timeless designs.
        </p>
      </div>

      {/* Search Input Bar (Editorial Form) */}
      <div className="w-full flex justify-between items-center gap-4 bg-[var(--color-canvas-light)] p-5 rounded-[var(--radius-lg)] border border-[var(--color-hairline-warm)]">
        <form method="GET" className="w-full flex gap-3 max-w-xl">
          <input
            name="search"
            defaultValue={search || ""}
            placeholder="Search catalog..."
            className="input-storefront-text grow bg-[var(--color-surface-product)] text-[var(--color-ink)] border border-transparent focus:border-[var(--color-ink)]/20 px-5 py-3 text-sm rounded-[var(--radius-pill)] outline-none font-sans"
          />
          {categoryId && <input type="hidden" name="category" value={categoryId} />}
          {price && <input type="hidden" name="price" value={price} />}
          {color && <input type="hidden" name="color" value={color} />}
          {size && <input type="hidden" name="size" value={size} />}
          <button type="submit" className="bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:opacity-90 font-sans font-medium text-xs uppercase tracking-wide px-8 py-3 rounded-[var(--radius-pill)] border-none transition-opacity">
            Search
          </button>
        </form>

        {search && (
          <Link
            href="/products"
            className="text-[11px] font-bold text-[var(--color-discount-text)] uppercase tracking-wider hover:underline font-sans"
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
            <Card variant="default" className="border border-[var(--color-hairline-warm)] p-12 flex flex-col items-center justify-center text-center gap-6 min-h-64 bg-[var(--color-canvas-light)] w-full rounded-[var(--radius-lg)]">
              <div className="w-16 h-16 rounded-full bg-[var(--color-surface-product)] flex items-center justify-center text-[var(--color-ink)] border border-[var(--color-hairline-warm)]">
                <PackageOpen className="h-8 w-8 stroke-[1.2]" />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="font-display text-2xl text-[var(--color-ink)]">
                  No Items Found
                </h2>
                <p className="text-sm font-sans text-[var(--color-shade-50)]">
                  Adjust your search or clear filters to view catalog collections.
                </p>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-8 animate-fade-in">
              <ProductGrid
                products={products}
                columns={{ mobile: 1, sm: 2, md: 3, lg: 3 }}
                renderCard={(product) => (
                  <FashionProductCard
                    key={product.id}
                    product={product}
                    subdomain={store.subdomain}
                    merchantId={store.id}
                  />
                )}
              />

              {/* Numbered Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12 border-t border-[var(--color-hairline-warm)] pt-8">
                  {/* Previous */}
                  <Link
                    href={buildPageUrl(page - 1)}
                    className={`px-5 py-2.5 rounded-[var(--radius-pill)] border text-xs font-sans font-medium tracking-wide uppercase transition-all select-none ${
                      page <= 1
                        ? "pointer-events-none opacity-40 border-[var(--color-hairline-warm)] bg-[var(--color-surface-product)] text-[var(--color-shade-40)]"
                        : "border-[var(--color-hairline-warm)] hover:border-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] cursor-pointer text-[var(--color-ink)]"
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
                        className={`h-9 w-9 flex items-center justify-center rounded-full border text-xs font-semibold transition-all select-none ${
                          isActive
                            ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)]"
                            : "border-[var(--color-hairline-warm)] hover:border-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] cursor-pointer text-[var(--color-ink)]"
                        }`}
                      >
                        {pageNum}
                      </Link>
                    )
                  })}

                  {/* Next */}
                  <Link
                    href={buildPageUrl(page + 1)}
                    className={`px-5 py-2.5 rounded-[var(--radius-pill)] border text-xs font-sans font-medium tracking-wide uppercase transition-all select-none ${
                      page >= pagination.totalPages
                        ? "pointer-events-none opacity-40 border-[var(--color-hairline-warm)] bg-[var(--color-surface-product)] text-[var(--color-shade-40)]"
                        : "border-[var(--color-hairline-warm)] hover:border-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] cursor-pointer text-[var(--color-ink)]"
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
