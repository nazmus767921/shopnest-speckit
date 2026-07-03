"use client";

import { useState, useMemo } from "react";
import { VariantSelector } from "@/components/storefront/variant-selector/VariantSelector";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import { BuyNowButton } from "@/components/storefront/BuyNowButton";
import type { VariantOption, AttributeInfo } from "@/components/storefront/variant-selector/VariantSelector";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StorefrontProduct {
  productId: string;
  slug: string;
  name: string;
  pricePaisa: number;
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

  return (
    <div className="space-y-4">
      <VariantSelector
        attributes={attributeInfos}
        variants={enrichedVariants}
        basePricePaisa={product.pricePaisa}
        onVariantSelect={setSelectedVariant}
      />

      {hasSelection && selectedVariant && (
        <div className="space-y-3">
          <AddToCartButton
            merchantId={merchantId}
            product={cartProduct!}
            size="lg"
            className="w-full text-body-strong font-medium"
          />
          <BuyNowButton
            subdomain={subdomain}
            product={cartProduct!}
            size="lg"
            className="w-full text-body-strong font-medium"
          />
        </div>
      )}

      {!hasSelection && (
        <p className="text-sm text-amber-600">
          Select all options to add to cart
        </p>
      )}
    </div>
  );
}
