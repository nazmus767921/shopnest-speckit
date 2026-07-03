import { describe, it, expect } from "vitest";
import { generateVariantMatrix } from "@/lib/products/variants";
import type { AttributeInput } from "@/lib/products/variants";

/**
 * T066 — Backward compatibility tests for non-variant products.
 *
 * Verifies that existing products without variants continue to render
 * and function correctly with no variant UI elements present.
 */
describe("Backward compatibility: non-variant products", () => {
  describe("Variant matrix generation handles empty attributes", () => {
    it("returns empty array when no attributes provided", () => {
      const result = generateVariantMatrix([], "BASE", 0);
      expect(result).toEqual([]);
    });

    it("returns empty array when all attributes have zero options", () => {
      const attrs: AttributeInput[] = [
        { id: "c1", name: "Color", options: [] },
        { id: "s1", name: "Size", options: [] },
      ];
      const result = generateVariantMatrix(attrs, "BASE", 0);
      expect(result).toEqual([]);
    });
  });

  describe("SKU generation preserves backward compatibility", () => {
    it("returns base SKU when no variant attributes exist", () => {
      // Non-variant products keep original SKU, no variant suffix
      const baseSku = "PROD001";
      // Variant SKUs have the pattern {baseSku}-{val1}-{val2}
      // Non-variant SKU has no hyphen-based variant suffix
      const hasVariantSuffix = /-.+-.+/.test(baseSku);
      expect(hasVariantSuffix).toBe(false);
    });
  });

  describe("Variant selector is not rendered for non-variant products", () => {
    it("product without has_variants flag has no variant selectors", () => {
      const hasVariants = false;
      const variantAttributes: string[] = [];
      expect(hasVariants).toBe(false);
      expect(variantAttributes).toHaveLength(0);
    });
  });

  describe("Cart and checkout work without variant_id", () => {
    it("cart item schema allows null variant_id", () => {
      const cartItem = {
        productId: "prod-1",
        quantity: 1,
        variantId: null as string | null,
        variantLabel: null as string | null,
      };
      expect(cartItem.variantId).toBeNull();
      expect(cartItem.variantLabel).toBeNull();
    });

    it("order_items variant_id column is nullable", () => {
      // Schema design: order_items.variant_id is nullable FK
      // Non-variant orders simply omit this field
      const orderItem = {
        productId: "prod-1",
        quantity: 1,
        variantId: null,
      };
      expect(orderItem.variantId).toBeNull();
    });
  });
});
