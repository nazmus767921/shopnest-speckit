"use client";

import { useQueryClient } from "@tanstack/react-query";

/**
 * Provides cache invalidation functions for variant-related queries.
 * Call these after variant mutations to ensure stale data is refetched.
 */
export function useVariantInvalidation(productId?: string) {
  const queryClient = useQueryClient();

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["variants", productId] });
    await queryClient.invalidateQueries({ queryKey: ["product", productId] });
    await queryClient.invalidateQueries({ queryKey: ["cart"] });
  };

  const invalidateAvailability = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["variant-availability", productId],
    });
  };

  const invalidateCart = async () => {
    await queryClient.invalidateQueries({ queryKey: ["cart"] });
  };

  return { invalidateAll, invalidateAvailability, invalidateCart };
}
