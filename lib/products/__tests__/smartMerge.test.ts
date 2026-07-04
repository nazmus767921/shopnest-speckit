import { describe, it, expect } from "vitest";
import { smartMergeVariants, generateVariantMatrix } from "../variants";
import type { AttributeInput } from "../variants";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const colorSizeAttrs: AttributeInput[] = [
  {
    id: "a1",
    name: "Color",
    options: [
      { id: "o1", label: "Red", value: "red" },
      { id: "o2", label: "Blue", value: "blue" },
    ],
  },
  {
    id: "a2",
    name: "Size",
    options: [
      { id: "o3", label: "S", value: "s" },
      { id: "o4", label: "M", value: "m" },
    ],
  },
];

const BASE_SKU = "PROD-001";
const BASE_PRICE = 50000;

// Create mock existing variants from generated matrix with some custom edits
function createExistingVariants(
  attrs: AttributeInput[],
  overrides?: Record<string, Partial<{ sku: string; pricePaisa: number; stockCount: number; isActive: boolean }>>,
): Array<{ id: string; attributeCombination: Record<string, string> }> {
  const matrix = generateVariantMatrix(attrs, BASE_SKU, BASE_PRICE);
  return matrix.map((entry, i) => {
    const comboKey = Object.values(entry.attributeCombination).join("-");
    const override = overrides?.[comboKey] ?? {};
    return {
      id: `variant-${i}`,
      attributeCombination: entry.attributeCombination,
      ...override,
    };
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("smartMergeVariants — T075: Adding an option", () => {
  it("should add new variants when a new option is added to an attribute", () => {
    const newAttrs: AttributeInput[] = [
      {
        id: "a1",
        name: "Color",
        options: [
          { id: "o1", label: "Red", value: "red" },
          { id: "o2", label: "Blue", value: "blue" },
          { id: "o5", label: "Green", value: "green" }, // NEW option
        ],
      },
      {
        id: "a2",
        name: "Size",
        options: [
          { id: "o3", label: "S", value: "s" },
          { id: "o4", label: "M", value: "m" },
        ],
      },
    ];

    const existing = createExistingVariants(colorSizeAttrs);
    const result = smartMergeVariants(
      colorSizeAttrs,
      newAttrs,
      existing,
      BASE_SKU,
      BASE_PRICE,
    );

    // 2 new combinations: Green/S, Green/M
    expect(result.toAdd).toHaveLength(2);
    // 4 existing preserved: Red/S, Red/M, Blue/S, Blue/M
    expect(result.toPreserve).toHaveLength(4);
    // Nothing deactivated
    expect(result.toDelete).toHaveLength(0);
  });

  it("should not generate duplicate variants when re-adding same options", () => {
    const existing = createExistingVariants(colorSizeAttrs);
    const result = smartMergeVariants(
      colorSizeAttrs,
      colorSizeAttrs,
      existing,
      BASE_SKU,
      BASE_PRICE,
    );

    // No changes — everything preserved, nothing added or deactivated
    expect(result.toAdd).toHaveLength(0);
    expect(result.toPreserve).toHaveLength(4);
    expect(result.toDelete).toHaveLength(0);
  });

  it("should add correct number of variants when option added to second attribute", () => {
    const newAttrs: AttributeInput[] = [
      {
        id: "a1",
        name: "Color",
        options: [
          { id: "o1", label: "Red", value: "red" },
          { id: "o2", label: "Blue", value: "blue" },
        ],
      },
      {
        id: "a2",
        name: "Size",
        options: [
          { id: "o3", label: "S", value: "s" },
          { id: "o4", label: "M", value: "m" },
          { id: "o5", label: "L", value: "l" }, // NEW
        ],
      },
    ];

    const existing = createExistingVariants(colorSizeAttrs);
    const result = smartMergeVariants(
      colorSizeAttrs,
      newAttrs,
      existing,
      BASE_SKU,
      BASE_PRICE,
    );

    // 2 new: Red/L, Blue/L
    expect(result.toAdd).toHaveLength(2);
    expect(result.toPreserve).toHaveLength(4);
    expect(result.toDelete).toHaveLength(0);
  });
});

describe("smartMergeVariants — T076: Removing an option", () => {
  it("should deactivate variants when an option is removed", () => {
    const newAttrs: AttributeInput[] = [
      {
        id: "a1",
        name: "Color",
        options: [
          { id: "o1", label: "Red", value: "red" },
          // Blue removed
        ],
      },
      {
        id: "a2",
        name: "Size",
        options: [
          { id: "o3", label: "S", value: "s" },
          { id: "o4", label: "M", value: "m" },
        ],
      },
    ];

    const existing = createExistingVariants(colorSizeAttrs);
    const result = smartMergeVariants(
      colorSizeAttrs,
      newAttrs,
      existing,
      BASE_SKU,
      BASE_PRICE,
    );

    // Blue variants deactivated (Blue/S, Blue/M)
    expect(result.toDelete).toHaveLength(2);
    // Red variants preserved (Red/S, Red/M)
    expect(result.toPreserve).toHaveLength(2);
    // Nothing new
    expect(result.toAdd).toHaveLength(0);
  });

  it("should deactivate correct variant IDs", () => {
    const newAttrs: AttributeInput[] = [
      {
        id: "a1",
        name: "Color",
        options: [
          { id: "o1", label: "Red", value: "red" },
        ],
      },
      {
        id: "a2",
        name: "Size",
        options: [
          { id: "o3", label: "S", value: "s" },
          { id: "o4", label: "M", value: "m" },
        ],
      },
    ];

    const existing = createExistingVariants(colorSizeAttrs);
    const result = smartMergeVariants(
      colorSizeAttrs,
      newAttrs,
      existing,
      BASE_SKU,
      BASE_PRICE,
    );

    // Only Blue variants deactivated (variant-1 = Blue/S, variant-3 = Blue/M)
    // Since matrix generates [Red/S, Red/M, Blue/S, Blue/M]
    expect(result.toDelete).toEqual(
      expect.arrayContaining(["variant-2", "variant-3"]),
    );
  });

  it("should preserve variants not affected by option removal", () => {
    const newAttrs: AttributeInput[] = [
      {
        id: "a1",
        name: "Color",
        options: [
          { id: "o1", label: "Red", value: "red" },
        ],
      },
      {
        id: "a2",
        name: "Size",
        options: [
          { id: "o3", label: "S", value: "s" },
          { id: "o4", label: "M", value: "m" },
        ],
      },
    ];

    const existing = createExistingVariants(colorSizeAttrs);
    const result = smartMergeVariants(
      colorSizeAttrs,
      newAttrs,
      existing,
      BASE_SKU,
      BASE_PRICE,
    );

    // Red/S, Red/M preserved
    expect(result.toPreserve).toEqual(
      expect.arrayContaining(["variant-0", "variant-1"]),
    );
  });
});

describe("smartMergeVariants — T077: Unchanged options preserve data", () => {
  it("should preserve all variant data when attributes unchanged", () => {
    const existing = createExistingVariants(colorSizeAttrs);
    const result = smartMergeVariants(
      colorSizeAttrs,
      colorSizeAttrs,
      existing,
      BASE_SKU,
      BASE_PRICE,
    );

    // All 4 variants preserved, nothing added/deactivated
    expect(result.toPreserve).toHaveLength(4);
    expect(result.toAdd).toHaveLength(0);
    expect(result.toDelete).toHaveLength(0);

    // The preserved IDs should match the existing variant IDs
    expect(result.toPreserve).toEqual(
      expect.arrayContaining(["variant-0", "variant-1", "variant-2", "variant-3"]),
    );
  });

  it("should preserve existing data when only unrelated attribute changes", () => {
    const newAttrs: AttributeInput[] = [
      {
        id: "a1",
        name: "Color",
        options: [
          { id: "o1", label: "Red", value: "red" },
          { id: "o2", label: "Blue", value: "blue" },
        ],
      },
      {
        id: "a2",
        name: "Size",
        options: [
          { id: "o3", label: "S", value: "s" },
          { id: "o4", label: "M", value: "m" },
          { id: "o5", label: "L", value: "l" }, // NEW
        ],
      },
    ];

    const existing = createExistingVariants(colorSizeAttrs);
    const result = smartMergeVariants(
      colorSizeAttrs,
      newAttrs,
      existing,
      BASE_SKU,
      BASE_PRICE,
    );

    // Original 4 preserved (Red/S, Red/M, Blue/S, Blue/M)
    expect(result.toPreserve).toHaveLength(4);
    // 2 new (Red/L, Blue/L)
    expect(result.toAdd).toHaveLength(2);
    expect(result.toDelete).toHaveLength(0);
  });
});

describe("smartMergeVariants — edge cases", () => {
  it("should deactivate ALL variants when all options removed", () => {
    const existing = createExistingVariants(colorSizeAttrs);
    // Remove all options
    const emptyAttrs: AttributeInput[] = [
      { id: "a1", name: "Color", options: [] },
      { id: "a2", name: "Size", options: [] },
    ];

    const result = smartMergeVariants(
      colorSizeAttrs,
      emptyAttrs,
      existing,
      BASE_SKU,
      BASE_PRICE,
    );

    // All existing deactivated; no new variants with empty options
    expect(result.toDelete).toHaveLength(4);
    expect(result.toPreserve).toHaveLength(0);
    expect(result.toAdd).toHaveLength(0);
  });

  it("should handle empty existing variants (no previous data)", () => {
    const result = smartMergeVariants(
      [], // no previous attributes
      colorSizeAttrs,
      [], // no existing variants
      BASE_SKU,
      BASE_PRICE,
    );

    // 4 new variants
    expect(result.toAdd).toHaveLength(4);
    expect(result.toPreserve).toHaveLength(0);
    expect(result.toDelete).toHaveLength(0);
  });

  it("should add all as new when adding a new attribute (dimension)", () => {
    const oneAttr: AttributeInput[] = [
      { id: "a1", name: "Color", options: [
        { id: "o1", label: "Red", value: "red" },
        { id: "o2", label: "Blue", value: "blue" },
      ]},
    ];

    const twoAttrs: AttributeInput[] = [
      { id: "a1", name: "Color", options: [
        { id: "o1", label: "Red", value: "red" },
        { id: "o2", label: "Blue", value: "blue" },
      ]},
      { id: "a2", name: "Size", options: [
        { id: "o3", label: "S", value: "s" },
        { id: "o4", label: "M", value: "m" },
      ]},
    ];

    const existing = createExistingVariants(oneAttr);
    const result = smartMergeVariants(
      oneAttr,
      twoAttrs,
      existing,
      BASE_SKU,
      BASE_PRICE,
    );

    // All old variants deactivated (their combination fingerprint doesn't match new ones)
    expect(result.toDelete).toHaveLength(2);
    // All new combinations added (Color×Size = 4)
    expect(result.toAdd).toHaveLength(4);
    expect(result.toPreserve).toHaveLength(0);
  });
});
