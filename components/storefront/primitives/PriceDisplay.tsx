"use client"

import React from "react"
import { formatTaka } from "@/lib/utils"

interface PriceDisplayProps {
  pricePaisa: number
  originalPricePaisa?: number | null
  discountPercent?: number | null
  className?: string
  size?: "sm" | "md" | "lg"
}

export function PriceDisplay({
  pricePaisa,
  originalPricePaisa,
  discountPercent,
  className = "",
  size = "md"
}: PriceDisplayProps) {
  const isLg = size === "lg"
  const isSm = size === "sm"
  
  const hasDiscount = originalPricePaisa !== undefined && originalPricePaisa !== null && originalPricePaisa > pricePaisa
  const percent = discountPercent || (hasDiscount && originalPricePaisa
    ? Math.round(((originalPricePaisa - pricePaisa) / originalPricePaisa) * 100)
    : 0)

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <span className={`font-sans font-bold text-[var(--color-ink)] ${isLg ? "text-2xl md:text-3xl" : isSm ? "text-sm" : "text-base md:text-lg"}`}>
        {formatTaka(pricePaisa)}
      </span>
      {hasDiscount && originalPricePaisa && (
        <>
          <span className={`font-sans text-[var(--color-shade-50)] line-through ${isLg ? "text-base md:text-lg" : isSm ? "text-xs" : "text-xs md:text-sm"}`}>
            {formatTaka(originalPricePaisa)}
          </span>
          <span className="tag-storefront-discount select-none">
            -{percent}%
          </span>
        </>
      )}
    </div>
  )
}
