"use client"

import React, { useState, useMemo } from "react"
import { VariantSelector } from "@/components/storefront/variant-selector/VariantSelector"
import { VariantSelectorErrorBoundary } from "@/components/storefront/variant-selector/VariantSelectorErrorBoundary"
import { AddToCartButton } from "@/components/storefront/shared/AddToCartButton"
import { BuyNowButton } from "@/components/storefront/shared/BuyNowButton"
import { QuantityAdjuster } from "@/components/storefront/shared/QuantityAdjuster"
import { PriceDisplay } from "@/components/storefront/shared/PriceDisplay"
import { cn } from "@/lib/utils"
import type { VariantOption, AttributeInfo } from "@/components/storefront/variant-selector/VariantSelector"
import type { StorefrontProduct } from "@/app/(storefront)/[subdomain]/product/[slug]/VariantProductClient"

interface FashionVariantProductClientProps {
  merchantId: string
  subdomain: string
  product: StorefrontProduct
  attributes: AttributeInfo[]
  variants: Array<{
    id: string
    sku: string
    pricePaisa: number | null
    compareAtPricePaisa: number | null
    stockCount: number
    isActive: boolean
    attributeCombination: Record<string, string>
  }>
}

export function FashionVariantProductClient({
  merchantId,
  subdomain,
  product,
  attributes,
  variants,
}: FashionVariantProductClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<VariantOption | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState<number>(1)

  const attributeInfos: AttributeInfo[] = useMemo(
    () =>
      attributes.map((attr) => ({
        ...attr,
        options: attr.options.map((opt) => ({
          ...opt,
        })),
      })),
    [attributes]
  )

  const enrichedVariants: VariantOption[] = useMemo(
    () =>
      variants.map((v) => ({
        ...v,
        id: v.id,
        sku: v.sku,
        pricePaisa: v.pricePaisa,
        compareAtPricePaisa: v.compareAtPricePaisa,
        stockCount: v.stockCount,
        isActive: v.isActive,
        attributeCombination: v.attributeCombination,
      })),
    [variants]
  )

  const cartProduct = useMemo(() => {
    if (selectedVariant) {
      return {
        ...product,
        pricePaisa: selectedVariant.pricePaisa ?? product.pricePaisa,
        stockCount: selectedVariant.stockCount,
        variantId: selectedVariant.id,
        variantLabel: Object.entries(selectedVariant.attributeCombination)
          .map(([key, val]) => `${key}: ${val}`)
          .join(", "),
      }
    }
    return null
  }, [selectedVariant, product])

  const hasSelection = selectedVariant !== null
  const activePricePaisa = selectedVariant?.pricePaisa ?? product.pricePaisa
  const activeCompareAtPricePaisa = selectedVariant
    ? (selectedVariant.compareAtPricePaisa ?? null)
    : (product.compareAtPricePaisa ?? null)

  const isSelectionIncomplete = Object.keys(selectedOptions).length < attributes.length

  const selectionStatus = useMemo(() => {
    const keys = Object.keys(selectedOptions)
    const missing = attributes.filter(attr => !selectedOptions[attr.name]).map(attr => attr.name)

    if (keys.length === 0) {
      return {
        message: "Configure your selection options",
        type: "info"
      }
    }

    if (missing.length > 0) {
      return {
        message: `Please select: ${missing.join(", ")}`,
        type: "incomplete"
      }
    }

    // Full combination selected - look for active variant matching these options
    const matched = variants.find(v => 
      attributes.every(attr => v.attributeCombination[attr.name] === selectedOptions[attr.name])
    )

    if (!matched || !matched.isActive) {
      return {
        message: "This combination is currently unavailable",
        type: "unavailable"
      }
    }

    if (matched.stockCount <= 0) {
      return {
        message: "Out of Stock - select another option",
        type: "out_of_stock"
      }
    }

    if (matched.stockCount <= 5) {
      return {
        message: `Low Stock: Only ${matched.stockCount} left`,
        type: "low_stock"
      }
    }

    return {
      message: "Ready to ship - in stock",
      type: "in_stock"
    }
  }, [selectedOptions, attributes, variants])

  const isSelectionAvailable = hasSelection && selectedVariant.stockCount > 0

  return (
    <div className="flex flex-col gap-6">
      {/* Price Display */}
      <PriceDisplay
        pricePaisa={activePricePaisa}
        originalPricePaisa={activeCompareAtPricePaisa}
        size="lg"
      />

      <div className="h-px bg-[var(--color-hairline-warm)] w-full my-2" />

      <VariantSelectorErrorBoundary>
        <VariantSelector
          attributes={attributeInfos}
          variants={enrichedVariants}
          basePricePaisa={product.pricePaisa}
          onVariantSelect={setSelectedVariant}
          onSelectionChange={setSelectedOptions}
        />
      </VariantSelectorErrorBoundary>

      {/* Steppers & Action Buttons */}
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
          {/* Stepper with custom background and style matching fashion palette */}
          <QuantityAdjuster
            quantity={quantity}
            maxQuantity={selectedVariant?.stockCount ?? 99}
            onChange={setQuantity}
            disabled={!isSelectionAvailable}
            className="w-full sm:w-32 bg-[#F5F4F1] border border-[var(--color-hairline-warm)]/40"
            size="lg"
          />

          {/* Add To Cart */}
          <AddToCartButton
            merchantId={merchantId}
            product={cartProduct || { ...product, variantId: undefined }}
            quantity={quantity}
            size="lg"
            className="w-full btn-storefront-primary py-4 font-sans font-medium uppercase tracking-wider text-xs rounded-full border-none hover:bg-zinc-800 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            disabled={!isSelectionAvailable}
          />
        </div>

        {isSelectionAvailable && cartProduct && (
          <BuyNowButton
            subdomain={subdomain}
            product={cartProduct}
            quantity={quantity}
            size="lg"
            className="w-full btn-storefront-outline py-4 font-sans font-medium uppercase tracking-wider text-xs rounded-full"
          />
        )}
      </div>

      {/* Status message */}
      <div className="flex items-center mt-1">
        <p className={cn(
          "text-xs font-sans tracking-wide uppercase font-semibold",
          selectionStatus.type === "info" || selectionStatus.type === "incomplete" ? "text-zinc-400" :
          selectionStatus.type === "in_stock" ? "text-emerald-600" :
          selectionStatus.type === "low_stock" ? "text-amber-600" : "text-red-500"
        )}>
          {selectionStatus.message}
        </p>
      </div>
    </div>
  )
}
