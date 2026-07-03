"use client";

import { useQuery } from "@tanstack/react-query";

// ─── Types ───────────────────────────────────────────────────────────────────

export type VariantAvailability = {
  id: string;
  sku: string;
  stockCount: number;
  isActive: boolean;
  pricePaisa: number | null;
};

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Fetches stock counts and availability for all variants of a product.
 * Returns a map of variant IDs to their availability info.
 */
export function useVariantAvailability(productId: string | undefined) {
  return useQuery({
    queryKey: ["variant-availability", productId],
    queryFn: async (): Promise<Record<string, VariantAvailability>> => {
      if (!productId) return {};

      const { getVariantsByProductId } = await import("@/db/queries/variants");
      const variants = await getVariantsByProductId(productId);

      const map: Record<string, VariantAvailability> = {};
      for (const v of variants) {
        map[v.id] = {
          id: v.id,
          sku: v.sku,
          stockCount: v.stockCount,
          isActive: v.isActive,
          pricePaisa: v.pricePaisa,
        };
      }
      return map;
    },
    enabled: !!productId,
    staleTime: 15_000, // 15s — stock counts change with purchases
    refetchInterval: 30_000, // Poll every 30s for stock updates
  });
}
