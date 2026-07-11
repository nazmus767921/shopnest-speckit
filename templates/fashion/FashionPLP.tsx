"use client"

import React from "react"
import Link from "next/link"
import { PackageOpenIcon } from "@/lib/icons";

import { Card } from "@/components/ui"
import { FashionProductFilters } from "./components/FashionProductFilters"
import { ProductCard } from "@/components/storefront/ProductCard"
import { type PLPProps } from "../types"
import { useSearchParams, useRouter } from "next/navigation"

export function FashionPLP({
  store,
  products,
  categories,
  activeFilters,
  pagination
}: PLPProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
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

      {/* Search & Horizontal Filters (Horizontal on Desktop, Slide Drawer on Mobile) */}
      <FashionProductFilters
        categories={categories}
        activeCategory={categoryId}
        activePrice={price}
        activeColor={color}
        activeSize={size}
      />

      {/* Products Display (Staggered 3-column on Desktop/Tablet, 1-column list on Mobile) */}
      <div className="w-full">
        {products.length === 0 ? (
          /* Elegant Minimalist Empty State */
          <div className="border border-[var(--color-hairline-warm)] py-24 px-6 flex flex-col items-center justify-center text-center gap-6 min-h-[350px] bg-[var(--color-surface-product)]/20 w-full rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[var(--color-ink)] border border-[var(--color-hairline-warm)] shrink-0">
              <PackageOpenIcon className="h-5 w-5 stroke-[1.2] text-zinc-400" />
            </div>
            <div className="flex flex-col gap-3 max-w-sm">
              <h2 className="font-display text-2xl md:text-3xl font-light uppercase tracking-[0.1em] text-[var(--color-ink)]">
                No Items Found
              </h2>
              <p className="text-[11px] font-sans text-zinc-400 tracking-wider uppercase leading-relaxed">
                We couldn't find any items matching your current filters or search terms.
              </p>
            </div>
            <button
              onClick={() => router.push(window.location.pathname)}
              className="mt-2 px-8 py-3 bg-black hover:bg-zinc-800 text-white rounded-full font-sans text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer border-none"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-8 animate-fade-in">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,360px),360px))] gap-8 md:gap-y-16">
              {products.map((product) => (
                <div key={product.id}>
                  <ProductCard
                    product={product}
                    subdomain={store.subdomain}
                    merchantId={store.id}
                    themeClass="storefront-theme-fashion"
                  />
                </div>
              ))}
            </div>

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
  )
}
