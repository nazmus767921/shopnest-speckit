"use client"

import React, { useState } from "react"
import { ProductCard, type ProductVariant, type ProductAttributeInfo } from "./ProductCard"

interface FormattedProduct {
  id: string
  name: string
  slug: string
  description: string | null
  pricePaisa: number
  stockCount: number
  lowStockThreshold: number
  images: { storagePath: string }[]
  category?: { id: string; name: string } | null
  promotions?: { promotionType: string }[]
  variants?: ProductVariant[]
  attributes?: ProductAttributeInfo[]
}

interface Category {
  id: string
  name: string
  slug: string
}

interface BoutiqueCatalogProps {
  products: FormattedProduct[]
  categories: Category[]
  subdomain: string
  merchantId: string
  themeClass?: string
}

export function BoutiqueCatalog({ products, categories, subdomain, merchantId, themeClass = "storefront-theme-default" }: BoutiqueCatalogProps) {
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null)

  // Listen to cross-component tab selection events
  React.useEffect(() => {
    const handleSelectTab = (e: Event) => {
      const tabValue = (e as CustomEvent).detail
      setSelectedTabId(tabValue)
      // Smooth scroll to catalog
      document.getElementById("boutique-catalog-section")?.scrollIntoView({ behavior: "smooth" })
    }
    window.addEventListener("shopnest:select-tab", handleSelectTab)
    return () => window.removeEventListener("shopnest:select-tab", handleSelectTab)
  }, [])

  // Filter categories to only those that have at least one product in the catalog
  const activeCategories = categories.filter((cat) =>
    products.some((p) => p.category?.id === cat.id)
  )

  const hasFeatured = products.some((p) => p.promotions?.some((pr) => pr.promotionType === "featured"))
  const hasNewArrival = products.some((p) => p.promotions?.some((pr) => pr.promotionType === "new_arrival"))

  // Filtering products
  const filteredProducts = React.useMemo(() => {
    if (selectedTabId === "promo:featured") {
      return products.filter((p) => p.promotions?.some((pr) => pr.promotionType === "featured"))
    }
    if (selectedTabId === "promo:new_arrival") {
      return products.filter((p) => p.promotions?.some((pr) => pr.promotionType === "new_arrival"))
    }
    if (selectedTabId) {
      return products.filter((p) => p.category?.id === selectedTabId)
    }
    return products
  }, [products, selectedTabId])

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Category & Promotion Tabs */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-3 scrollbar-none border-b border-hairline-light select-none">
        <button
          onClick={() => setSelectedTabId(null)}
          className={`px-4.5 py-2 rounded-full text-caption font-semibold transition-all shrink-0 cursor-pointer ${
            selectedTabId === null
              ? "bg-primary text-on-primary"
              : "bg-canvas-cream border border-hairline-light hover:border-shade-40 text-shade-60"
          }`}
        >
          All Items
        </button>

        {hasFeatured && (
          <button
            onClick={() => setSelectedTabId("promo:featured")}
            className={`px-4.5 py-2 rounded-full text-caption font-semibold transition-all shrink-0 cursor-pointer ${
              selectedTabId === "promo:featured"
                ? "bg-primary text-on-primary"
                : "bg-canvas-cream border border-hairline-light hover:border-shade-40 text-shade-60"
            }`}
          >
            Featured
          </button>
        )}

        {hasNewArrival && (
          <button
            onClick={() => setSelectedTabId("promo:new_arrival")}
            className={`px-4.5 py-2 rounded-full text-caption font-semibold transition-all shrink-0 cursor-pointer ${
              selectedTabId === "promo:new_arrival"
                ? "bg-primary text-on-primary"
                : "bg-canvas-cream border border-hairline-light hover:border-shade-40 text-shade-60"
            }`}
          >
            New Arrivals
          </button>
        )}

        {activeCategories.map((cat) => {
          const isActive = selectedTabId === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedTabId(cat.id)}
              className={`px-4.5 py-2 rounded-full text-caption font-semibold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-primary text-on-primary"
                  : "bg-canvas-cream border border-hairline-light hover:border-shade-40 text-shade-60"
              }`}
            >
              {cat.name}
            </button>
          )
        })}
      </div>

      {/* Catalog Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-shade-50">
          No products found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              subdomain={subdomain}
              merchantId={merchantId}
              themeClass={themeClass}
            />
          ))}
        </div>
      )}
    </div>
  )
}
