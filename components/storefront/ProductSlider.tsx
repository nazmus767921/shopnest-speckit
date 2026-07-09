"use client"

import React, { useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
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

interface ProductSliderProps {
  products: FormattedProduct[]
  subdomain: string
  merchantId: string
  totalCount?: number
  promoType?: "featured" | "new_arrival"
  themeClass?: string
}

export function ProductSlider({ products, subdomain, merchantId, totalCount, promoType, themeClass = "storefront-theme-default" }: ProductSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showLeftBtn, setShowLeftBtn] = useState(false)
  const [showRightBtn, setShowRightBtn] = useState(true)

  const checkScrollLimits = () => {
    const container = containerRef.current
    if (!container) return

    setShowLeftBtn(container.scrollLeft > 5)
    // Show right button if there is still room to scroll right
    const maxScroll = container.scrollWidth - container.clientWidth
    setShowRightBtn(container.scrollLeft < maxScroll - 5)
  }

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener("scroll", checkScrollLimits)
      // Check limits initially and on resize
      checkScrollLimits()
      window.addEventListener("resize", checkScrollLimits)
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", checkScrollLimits)
      }
      window.removeEventListener("resize", checkScrollLimits)
    }
  }, [products])

  const scroll = (direction: "left" | "right") => {
    const container = containerRef.current
    if (!container) return

    const scrollAmount = container.clientWidth * 0.75
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    })
  }

  return (
    <div className="flex flex-col w-full">
      <div className="relative group/slider w-full">
        {/* Scrollable Container */}
        <div
          ref={containerRef}
          className="w-full flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 select-none scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[280px] sm:w-[320px] md:w-[340px] shrink-0 snap-start"
            >
              <ProductCard
                product={product}
                subdomain={subdomain}
                merchantId={merchantId}
                themeClass={themeClass}
              />
            </div>
          ))}
        </div>

        {/* Left Navigation Button */}
        {showLeftBtn && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-4 top-[40%] -translate-y-1/2 bg-canvas-light border border-hairline-light hover:bg-canvas-cream text-ink p-2.5 rounded-[var(--radius)] z-20 shadow-md cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
          </button>
        )}

        {/* Right Navigation Button */}
        {showRightBtn && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-4 top-[40%] -translate-y-1/2 bg-canvas-light border border-hairline-light hover:bg-canvas-cream text-ink p-2.5 rounded-[var(--radius)] z-20 shadow-md cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* View All Button */}
      {totalCount !== undefined && totalCount > 5 && promoType && (
        <div className="flex justify-center mt-6 pt-2">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("shopnest:select-tab", { detail: `promo:${promoType}` }))
            }}
            className="btn-storefront-outline text-storefront-body-strong px-8 py-3 cursor-pointer select-none"
          >
            Discover All {promoType === "featured" ? "Featured" : "New Arrivals"} ({totalCount})
          </button>
        </div>
      )}
    </div>
  )
}
