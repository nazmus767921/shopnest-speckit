/**
 * T078 — Bulk Toolbar & T079 — Filter Bar tests
 *
 * @see specs/20-product-variants-metadata/spec.md#US5
 */
import { describe, it, expect } from "vitest";
import { bulkVariantUpdateSchema } from "@/lib/validations/variants";

// ─── T078: Bulk Update Schema Validation ─────────────────────────────────────

describe("T078 — bulkVariantUpdateSchema", () => {
  it("should accept price adjustment (fixed) with variant IDs", () => {
    const input = {
      variantIds: ["v1", "v2", "v3"],
      priceAdjustment: { type: "fixed" as const, value: 10000 },
    };
    const result = bulkVariantUpdateSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should accept price adjustment (percent) with variant IDs", () => {
    const input = {
      variantIds: ["v1", "v2"],
      priceAdjustment: { type: "percent" as const, value: 10 }, // +10%
    };
    const result = bulkVariantUpdateSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priceAdjustment?.value).toBe(10);
    }
  });

  it("should accept price adjustment (add_amount) with variant IDs", () => {
    const input = {
      variantIds: ["v1"],
      priceAdjustment: { type: "add_amount" as const, value: -500 }, // -500 paisa
    };
    const result = bulkVariantUpdateSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should accept stock count update", () => {
    const input = {
      variantIds: ["v1", "v2"],
      stockCount: 50,
    };
    const result = bulkVariantUpdateSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should accept bulk activate/deactivate", () => {
    const input = {
      variantIds: ["v1"],
      isActive: false,
    };
    const result = bulkVariantUpdateSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should accept SKU prefix change", () => {
    const input = {
      variantIds: ["v1", "v2"],
      skuPrefix: "NEW-SKU",
    };
    const result = bulkVariantUpdateSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject empty variantIds array", () => {
    const input = {
      variantIds: [],
      stockCount: 10,
    };
    const result = bulkVariantUpdateSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should accept combined operations (price + stock + status)", () => {
    const input = {
      variantIds: ["v1", "v2", "v3"],
      priceAdjustment: { type: "fixed" as const, value: 5000 },
      stockCount: 100,
      isActive: true,
    };
    const result = bulkVariantUpdateSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

// ─── T079: Filter/Search Logic ───────────────────────────────────────────────

describe("T079 — variant filtering logic", () => {
  // Mock variants with attribute combinations
  const mockVariants = [
    { id: "v1", sku: "SHIRT-RED-S", stockCount: 5, isActive: true, combination: { Color: "red", Size: "s" } },
    { id: "v2", sku: "SHIRT-RED-M", stockCount: 3, isActive: true, combination: { Color: "red", Size: "m" } },
    { id: "v3", sku: "SHIRT-RED-L", stockCount: 0, isActive: true, combination: { Color: "red", Size: "l" } },
    { id: "v4", sku: "SHIRT-BLUE-S", stockCount: 2, isActive: true, combination: { Color: "blue", Size: "s" } },
    { id: "v5", sku: "SHIRT-BLUE-M", stockCount: 7, isActive: false, combination: { Color: "blue", Size: "m" } },
    { id: "v6", sku: "SHIRT-BLUE-L", stockCount: 4, isActive: true, combination: { Color: "blue", Size: "l" } },
  ];

  it("should filter by attribute combination (Color=red)", () => {
    const filtered = mockVariants.filter((v) => v.combination.Color === "red");
    expect(filtered).toHaveLength(3);
    expect(filtered.map((v) => v.id)).toEqual(["v1", "v2", "v3"]);
  });

  it("should filter by multiple attribute combinations (Color=blue, Size=l)", () => {
    const filtered = mockVariants.filter(
      (v) => v.combination.Color === "blue" && v.combination.Size === "l",
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("v6");
  });

  it("should filter by SKU search (partial match)", () => {
    const query = "RED";
    const filtered = mockVariants.filter((v) =>
      v.sku.toLowerCase().includes(query.toLowerCase()),
    );
    expect(filtered).toHaveLength(3);
    expect(filtered.map((v) => v.id)).toEqual(["v1", "v2", "v3"]);
  });

  it("should filter by stock level (out of stock)", () => {
    const filtered = mockVariants.filter((v) => v.stockCount === 0);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("v3");
  });

  it("should filter by active status", () => {
    const filtered = mockVariants.filter((v) => !v.isActive);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("v5");
  });

  it("should combine attribute + stock filters", () => {
    const filtered = mockVariants.filter(
      (v) => v.combination.Color === "red" && v.stockCount > 0,
    );
    expect(filtered).toHaveLength(2);
    expect(filtered.map((v) => v.id)).toEqual(["v1", "v2"]);
  });

  it("should return empty when no match", () => {
    const filtered = mockVariants.filter(
      (v) => v.combination.Color === "green",
    );
    expect(filtered).toHaveLength(0);
  });
});
