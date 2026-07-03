import { describe, it, expect } from "vitest";
import { generateVariantMatrix, skuFromAttributes, selectVariantForOptions } from "../variants";
import type { AttributeInput, VariantSummary } from "../variants";

// ─── Test Fixtures ───────────────────────────────────────────────────────────

const colorSizeAttributes: AttributeInput[] = [
  {
    id: "attr-1",
    name: "Color",
    options: [
      { id: "opt-1", label: "Red", value: "red" },
      { id: "opt-2", label: "Blue", value: "blue" },
    ],
  },
  {
    id: "attr-2",
    name: "Size",
    options: [
      { id: "opt-3", label: "S", value: "s" },
      { id: "opt-4", label: "M", value: "m" },
    ],
  },
];

const BASE_SKU = "PROD-001";
const BASE_PRICE = 50000; // 500.00 in paisa

// ─── generateVariantMatrix ───────────────────────────────────────────────────

describe("generateVariantMatrix", () => {
  it("should return 4 entries for 2 attributes × 2 options (T011)", () => {
    const result = generateVariantMatrix(colorSizeAttributes, BASE_SKU, BASE_PRICE);

    expect(result).toHaveLength(4);
  });

  it("should return empty array for 0 attributes (T012)", () => {
    const result = generateVariantMatrix([], BASE_SKU, BASE_PRICE);

    expect(result).toHaveLength(0);
  });

  it("should return 27 entries for 3 attributes × 3 options (T013)", () => {
    const threeAttr: AttributeInput[] = [
      {
        id: "a1",
        name: "Color",
        options: [
          { id: "o1", label: "Red", value: "red" },
          { id: "o2", label: "Blue", value: "blue" },
          { id: "o3", label: "Green", value: "green" },
        ],
      },
      {
        id: "a2",
        name: "Size",
        options: [
          { id: "o4", label: "S", value: "s" },
          { id: "o5", label: "M", value: "m" },
          { id: "o6", label: "L", value: "l" },
        ],
      },
      {
        id: "a3",
        name: "Material",
        options: [
          { id: "o7", label: "Cotton", value: "cotton" },
          { id: "o8", label: "Polyester", value: "polyester" },
          { id: "o9", label: "Wool", value: "wool" },
        ],
      },
    ];

    const result = generateVariantMatrix(threeAttr, BASE_SKU, BASE_PRICE);
    expect(result).toHaveLength(27);
  });

  it("should return 1000 entries for max capacity 3×10×10×10 (T014)", () => {
    const maxAttrs: AttributeInput[] = [
      {
        id: "a1",
        name: "Color",
        options: Array.from({ length: 10 }, (_, i) => ({
          id: `c${i}`,
          label: `Color ${i}`,
          value: `color-${i}`,
        })),
      },
      {
        id: "a2",
        name: "Size",
        options: Array.from({ length: 10 }, (_, i) => ({
          id: `s${i}`,
          label: `Size ${i}`,
          value: `size-${i}`,
        })),
      },
      {
        id: "a3",
        name: "Material",
        options: Array.from({ length: 10 }, (_, i) => ({
          id: `m${i}`,
          label: `Mat ${i}`,
          value: `mat-${i}`,
        })),
      },
    ];

    const result = generateVariantMatrix(maxAttrs, BASE_SKU, BASE_PRICE);
    expect(result).toHaveLength(1000);
  });

  it("should generate correct SKU patterns (T018)", () => {
    const result = generateVariantMatrix(colorSizeAttributes, "BASE", BASE_PRICE);

    const skus = result.map((e) => e.sku);
    expect(skus).toContain("BASE-red-s");
    expect(skus).toContain("BASE-red-m");
    expect(skus).toContain("BASE-blue-s");
    expect(skus).toContain("BASE-blue-m");
  });

  it("should set default price to null (inherit base)", () => {
    const result = generateVariantMatrix(colorSizeAttributes, BASE_SKU, BASE_PRICE);

    for (const entry of result) {
      expect(entry.price).toBeNull();
    }
  });

  it("should set default stockCount to 0", () => {
    const result = generateVariantMatrix(colorSizeAttributes, BASE_SKU, BASE_PRICE);

    for (const entry of result) {
      expect(entry.stockCount).toBe(0);
    }
  });

  it("should set isActive to true by default", () => {
    const result = generateVariantMatrix(colorSizeAttributes, BASE_SKU, BASE_PRICE);

    for (const entry of result) {
      expect(entry.isActive).toBe(true);
    }
  });

  it("should generate correct labels", () => {
    const result = generateVariantMatrix(colorSizeAttributes, BASE_SKU, BASE_PRICE);

    const labels = result.map((e) => e.label);
    expect(labels).toContain("Red / S");
    expect(labels).toContain("Red / M");
    expect(labels).toContain("Blue / S");
    expect(labels).toContain("Blue / M");
  });

  it("should throw for >3 attributes", () => {
    const tooManyAttrs: AttributeInput[] = Array.from({ length: 4 }, (_, i) => ({
      id: `a${i}`,
      name: `Attr ${i}`,
      options: [{ id: `o${i}`, label: "Default", value: "default" }],
    }));

    expect(() => generateVariantMatrix(tooManyAttrs, BASE_SKU, BASE_PRICE)).toThrow(
      "Maximum 3 attributes",
    );
  });

  it("should throw for >10 options per attribute", () => {
    const tooManyOptions: AttributeInput[] = [
      {
        id: "a1",
        name: "Color",
        options: Array.from({ length: 11 }, (_, i) => ({
          id: `o${i}`,
          label: `Opt ${i}`,
          value: `opt-${i}`,
        })),
      },
    ];

    expect(() => generateVariantMatrix(tooManyOptions, BASE_SKU, BASE_PRICE)).toThrow(
      "Maximum 10 options",
    );
  });

  it("should handle exactly 1000 variants without throwing (max capacity boundary)", () => {
    // 3 attrs × 10 options each = 1000 (theoretical max)
    const attrs: AttributeInput[] = [
      {
        id: "a1",
        name: "Color",
        options: Array.from({ length: 10 }, (_, i) => ({
          id: `c${i}`,
          label: `Color ${i}`,
          value: `color-${i}`,
        })),
      },
      {
        id: "a2",
        name: "Size",
        options: Array.from({ length: 10 }, (_, i) => ({
          id: `s${i}`,
          label: `Size ${i}`,
          value: `size-${i}`,
        })),
      },
      {
        id: "a3",
        name: "Material",
        options: Array.from({ length: 10 }, (_, i) => ({
          id: `m${i}`,
          label: `Mat ${i}`,
          value: `mat-${i}`,
        })),
      },
    ];

    // Note: the 1000 variant cap is a safety net — 3×10×10×10 = 1000 exactly
    // means per-attribute limits (≤10) enforce it. Both checks exist defensively.
    expect(() => generateVariantMatrix(attrs, BASE_SKU, BASE_PRICE)).not.toThrow();
  });
});

// ─── skuFromAttributes ───────────────────────────────────────────────────────

describe("skuFromAttributes", () => {
  it("should join base SKU with option values using hyphens", () => {
    expect(skuFromAttributes("BASE", ["red", "m"])).toBe("BASE-red-m");
    expect(skuFromAttributes("BASE", ["blue", "l", "cotton"])).toBe("BASE-blue-l-cotton");
  });

  it("should return just the base SKU when no options", () => {
    expect(skuFromAttributes("BASE", [])).toBe("BASE");
  });
});

// ─── selectVariantForOptions ─────────────────────────────────────────────────

describe("selectVariantForOptions", () => {
  const mockVariants: VariantSummary[] = [
    {
      id: "v1",
      sku: "BASE-red-s",
      price: null,
      stockCount: 10,
      isActive: true,
      attributeCombination: { Color: "red", Size: "s" },
    },
    {
      id: "v2",
      sku: "BASE-red-m",
      price: null,
      stockCount: 5,
      isActive: true,
      attributeCombination: { Color: "red", Size: "m" },
    },
    {
      id: "v3",
      sku: "BASE-blue-s",
      price: 55000,
      stockCount: 0,
      isActive: true,
      attributeCombination: { Color: "blue", Size: "s" },
    },
    {
      id: "v4",
      sku: "BASE-blue-m",
      price: null,
      stockCount: 3,
      isActive: false,
      attributeCombination: { Color: "blue", Size: "m" },
    },
  ];

  it("should return correct variant for exact attribute match (T037)", () => {
    const result = selectVariantForOptions(mockVariants, { Color: "red", Size: "m" });
    expect(result).not.toBeNull();
    expect(result!.id).toBe("v2");
  });

  it("should return null for non-existent combination (T038)", () => {
    const result = selectVariantForOptions(mockVariants, { Color: "green", Size: "m" });
    expect(result).toBeNull();
  });

  it("should return null for inactive variant", () => {
    const result = selectVariantForOptions(mockVariants, { Color: "blue", Size: "m" });
    expect(result).toBeNull();
  });

  it("should still return variant with 0 stock (just inactive ones excluded)", () => {
    const result = selectVariantForOptions(mockVariants, { Color: "blue", Size: "s" });
    expect(result).not.toBeNull();
    expect(result!.id).toBe("v3");
    expect(result!.stockCount).toBe(0);
  });
});

// ─── Performance Test ──────────────────────────────────────────────────────────

describe("Performance: max capacity variant matrix", () => {
  it("generates 1000 variants (3 attributes × 10 options) in under 100ms", () => {
    const attrs: AttributeInput[] = [
      {
        id: "perf-color",
        name: "Color",
        options: Array.from({ length: 10 }, (_, i) => ({
          id: `pc-${i}`,
          label: `Color ${i}`,
          value: `color-${i}`,
        })),
      },
      {
        id: "perf-size",
        name: "Size",
        options: Array.from({ length: 10 }, (_, i) => ({
          id: `ps-${i}`,
          label: `Size ${i}`,
          value: `size-${i}`,
        })),
      },
      {
        id: "perf-mat",
        name: "Material",
        options: Array.from({ length: 10 }, (_, i) => ({
          id: `pm-${i}`,
          label: `Material ${i}`,
          value: `material-${i}`,
        })),
      },
    ];

    const start = performance.now();
    const result = generateVariantMatrix(attrs, "PERF", 0);
    const elapsed = performance.now() - start;

    expect(result).toHaveLength(1000);
    expect(elapsed).toBeLessThan(100);
  });

  it("generates 100 variants (2 attributes × 10 options) in under 20ms", () => {
    const attrs: AttributeInput[] = [
      {
        id: "perf-color2",
        name: "Color",
        options: Array.from({ length: 10 }, (_, i) => ({
          id: `pc2-${i}`,
          label: `Color ${i}`,
          value: `color-${i}`,
        })),
      },
      {
        id: "perf-size2",
        name: "Size",
        options: Array.from({ length: 10 }, (_, i) => ({
          id: `ps2-${i}`,
          label: `Size ${i}`,
          value: `size-${i}`,
        })),
      },
    ];

    const start = performance.now();
    const result = generateVariantMatrix(attrs, "PERF", 0);
    const elapsed = performance.now() - start;

    expect(result).toHaveLength(100);
    expect(elapsed).toBeLessThan(20);
  });
});
