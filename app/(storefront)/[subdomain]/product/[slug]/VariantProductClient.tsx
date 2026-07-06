"use client";

import { useState, useMemo } from "react";
import { VariantSelector } from "@/components/storefront/variant-selector/VariantSelector";
import { VariantSelectorErrorBoundary } from "@/components/storefront/variant-selector/VariantSelectorErrorBoundary";
import { AddToCartButton } from "@/components/storefront/shared/AddToCartButton";
import { BuyNowButton } from "@/components/storefront/shared/BuyNowButton";
import { QuantityAdjuster } from "@/components/storefront/shared/QuantityAdjuster";
import type { VariantOption, AttributeInfo } from "@/components/storefront/variant-selector/VariantSelector";
import { formatTaka } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StorefrontProduct {
  productId: string;
  slug: string;
  name: string;
  pricePaisa: number;
  compareAtPricePaisa?: number | null;
  stockCount: number;
  imageUrl: string | null;
}

interface VariantProductClientProps {
  merchantId: string;
  subdomain: string;
  product: StorefrontProduct;
  attributes: AttributeInfo[];
  variants: Array<{
    id: string;
    sku: string;
    pricePaisa: number | null;
    compareAtPricePaisa: number | null;
    stockCount: number;
    isActive: boolean;
    attributeCombination: Record<string, string>;
  }>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VariantProductClient({
  merchantId,
  subdomain,
  product,
  attributes,
  variants,
}: VariantProductClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<VariantOption | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  // Build attribute options with attribute names resolved
  const attributeInfos: AttributeInfo[] = useMemo(
    () =>
      attributes.map((attr) => ({
        ...attr,
        options: attr.options.map((opt) => ({
          ...opt,
        })),
      })),
    [attributes],
  );

  // Enrich variants with full attribute combinations
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
    [variants],
  );

  // Build the cart product from the selected variant
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
      };
    }
    return null;
  }, [selectedVariant, product]);

  const hasSelection = selectedVariant !== null;
  const activePricePaisa = selectedVariant?.pricePaisa ?? product.pricePaisa;

  const activeCompareAtPricePaisa = selectedVariant
    ? (selectedVariant.compareAtPricePaisa ?? null)
    : (product.compareAtPricePaisa ?? null);

  const hasComparePrice = activeCompareAtPricePaisa !== null && activeCompareAtPricePaisa > activePricePaisa;

  const discountPercent = hasComparePrice
    ? Math.round(((activeCompareAtPricePaisa! - activePricePaisa) / activeCompareAtPricePaisa!) * 100)
    : 30; // default simulated fallback discount

  const originalPricePaisa = hasComparePrice
    ? activeCompareAtPricePaisa!
    : Math.round(activePricePaisa / (1 - 30 / 100));

  return (
    <div className="flex flex-col gap-4">
      {/* Dynamic Price Display */}
      <div className="flex items-center gap-3 select-none">
        <span className="font-sans text-2xl md:text-3xl font-extrabold text-ink">
          {formatTaka(activePricePaisa)}
        </span>
        <span className="font-sans text-lg md:text-xl font-bold text-shade-40 line-through">
          {formatTaka(originalPricePaisa)}
        </span>
        <span className="bg-[#FF33331A] text-[#FF3333] px-3 py-0.5 rounded-full text-xs md:text-sm font-bold font-sans">
          -{discountPercent}%
        </span>
      </div>

      <div className="h-px bg-hairline-light w-full my-2" />

      <VariantSelectorErrorBoundary>
        <VariantSelector
          attributes={attributeInfos}
          variants={enrichedVariants}
          basePricePaisa={product.pricePaisa}
          onVariantSelect={setSelectedVariant}
        />
      </VariantSelectorErrorBoundary>

      {/* Steppers & Action Buttons */}
      <div className="flex flex-col gap-4 mt-6">
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
          {/* Stepper */}
          <QuantityAdjuster
            quantity={quantity}
            maxQuantity={selectedVariant?.stockCount ?? 99}
            onChange={setQuantity}
            disabled={!hasSelection}
            className="w-full sm:w-32.5"
            size="lg"
          />

          {/* Add To Cart */}
          <AddToCartButton
            merchantId={merchantId}
            product={cartProduct || { ...product, variantId: undefined }}
            quantity={quantity}
            size="lg"
            className="w-full h-12 rounded-full bg-primary text-white font-bold font-sans cursor-pointer flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          />
        </div>

        {hasSelection && cartProduct && (
          <BuyNowButton
            subdomain={subdomain}
            product={cartProduct}
            quantity={quantity}
            size="lg"
            className="w-full h-12 rounded-full border border-hairline-light hover:bg-zinc-50 font-bold font-sans cursor-pointer flex items-center justify-center transition-colors"
          />
        )}
      </div>

      {!hasSelection && (
        <p className="text-sm text-amber-600 font-sans mt-2">
          Select all options to add to cart
        </p>
      )}
    </div>
  );
}
