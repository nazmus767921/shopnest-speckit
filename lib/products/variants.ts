/**
 * Variant Matrix Library
 *
 * Pure functions for generating and querying product variant matrices.
 * No side effects — all I/O is handled by Server Actions and Drizzle queries.
 *
 * @see specs/20-product-variants-metadata/contracts/variant-matrix.md
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type AttributeInput = {
  id: string;
  name: string;
  options: Array<{
    id: string;
    label: string;
    value: string;
  }>;
};

export type VariantMatrixEntry = {
  attributeCombination: Record<string, string>;
  label: string;
  sku: string;
  price: number | null;
  stockCount: number;
  isActive: boolean;
};

export type VariantSummary = {
  id: string;
  sku: string;
  price: number | null;
  stockCount: number;
  isActive: boolean;
  attributeCombination: Record<string, string>;
};

// ─── Matrix Generation ───────────────────────────────────────────────────────

/**
 * Computes the Cartesian product of attribute options to produce the variant matrix.
 *
 * @param attributes - Array of attributes (max 3) with their options (max 10 each)
 * @param baseSku - Base product SKU for auto-generating variant SKUs
 * @param basePrice - Base product price (variants inherit when null)
 * @returns One entry per combination in the Cartesian product
 *
 * @pure No side effects. Deterministic for same inputs.
 */
export function generateVariantMatrix(
  attributes: AttributeInput[],
  baseSku: string,
  basePrice: number,
): VariantMatrixEntry[] {
  if (attributes.length === 0) {
    return [];
  }

  // Validate limits
  if (attributes.length > 3) {
    throw new Error("Maximum 3 attributes allowed per product");
  }

  for (const attr of attributes) {
    if (attr.options.length > 10) {
      throw new Error(
        `Maximum 10 options allowed per attribute (attribute "${attr.name}" has ${attr.options.length})`,
      );
    }
  }

  // Build option value arrays
  const optionSets = attributes.map((attr) =>
    attr.options.map((opt) => ({
      attributeName: attr.name,
      optionId: opt.id,
      optionLabel: opt.label,
      optionValue: opt.value,
    })),
  );

  // Compute Cartesian product
  const combinations = cartesianProduct(optionSets);

  // Check total variant cap
  if (combinations.length > 1000) {
    throw new Error(
      `Maximum 1000 variants allowed (generating ${combinations.length} would exceed limit)`,
    );
  }

  return combinations.map((combo) => {
    const attrCombination: Record<string, string> = {};
    const labelParts: string[] = [];
    const skuParts: string[] = [];

    for (const item of combo) {
      attrCombination[item.attributeName] = item.optionValue;
      labelParts.push(item.optionLabel);
      skuParts.push(item.optionValue);
    }

    const sku = skuFromAttributes(baseSku, skuParts);

    return {
      attributeCombination: attrCombination,
      label: labelParts.join(" / "),
      sku,
      price: null, // inherit base by default
      stockCount: 0,
      isActive: true,
    };
  });
}

/**
 * Generates a variant SKU from the base SKU and attribute option values.
 *
 * Pattern: `{baseSku}-{val1}-{val2}-...`
 */
export function skuFromAttributes(baseSku: string, optionValues: string[]): string {
  return [baseSku, ...optionValues].join("-");
}

// ─── Variant Selection ────────────────────────────────────────────────────────

/**
 * Given a set of selected attribute values and all variants, returns the
 * matching variant or null.
 *
 * @param variants - All variants for a product
 * @param selectedOptions - Map of attribute name → option value (e.g., { Color: "red", Size: "m" })
 * @returns The matching variant or null if no match or variant is inactive
 *
 * @pure No side effects.
 */
export function selectVariantForOptions(
  variants: VariantSummary[],
  selectedOptions: Record<string, string>,
): VariantSummary | null {
  return (
    variants.find(
      (v) =>
        v.isActive &&
        Object.entries(selectedOptions).every(
          ([key, value]) => v.attributeCombination[key] === value,
        ),
    ) ?? null
  );
}

// ─── Smart Merge ─────────────────────────────────────────────────────────────

/**
 * Result of a smart merge operation.
 *
 * - `toPreserve`: Existing variant IDs whose attribute combination still exists —
 *   keep their data (price, SKU overrides, stock, isActive) unchanged.
 * - `toDeactivate`: Existing variant IDs whose combination was removed —
 *   set is_active = false instead of deleting.
 * - `toAdd`: New variant entries for combinations that don't exist yet —
 *   insert with defaults.
 */
export type SmartMergeResult = {
  toPreserve: string[];
  toDeactivate: string[];
  toAdd: VariantMatrixEntry[];
};

/**
 * Creates a stable fingerprint for an attribute combination.
 * Sorted by attribute name for deterministic ordering.
 */
export function variantFingerprint(
  combination: Record<string, string>,
): string {
  return Object.entries(combination)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
}

/**
 * Smart-merge algorithm that compares old vs new attribute configurations
 * and produces a diff of variant IDs to preserve, deactivate, or add.
 *
 * Key behaviors:
 * - Option removed → matching variants are **deactivated** (not deleted)
 * - Option added → only new combinations are **added** (existing preserved)
 * - Unchanged options → all existing data (price, SKU, stock, status) is **preserved**
 * - Attribute added/removed → **all** old variants deactivated, **all** new added
 *
 * @param oldAttributes - Previous attribute configuration (from variantGeneration)
 * @param newAttributes - New attribute configuration (from user input)
 * @param existingVariants - Current variants in DB (with their data)
 * @param baseSku - Base product SKU for auto-generating new variant SKUs
 * @param basePrice - Base product price
 * @returns Instructions for what to do with each variant
 *
 * @pure No side effects. Deterministic for same inputs.
 */
export function smartMergeVariants(
  oldAttributes: AttributeInput[],
  newAttributes: AttributeInput[],
  existingVariants: Array<{
    id: string;
    attributeCombination: Record<string, string>;
  }>,
  baseSku: string,
  basePrice: number,
): SmartMergeResult {
  // Generate all old and new combinations
  const oldCombinations = generateVariantMatrix(oldAttributes, baseSku, basePrice);
  const newCombinations = generateVariantMatrix(newAttributes, baseSku, basePrice);

  // Build fingerprint sets
  const newFingerprints = new Set(
    newCombinations.map((c) => variantFingerprint(c.attributeCombination)),
  );

  // Build existing variant fingerprint map
  const existingFingerprintMap = new Map<string, string>();
  for (const v of existingVariants) {
    existingFingerprintMap.set(
      variantFingerprint(v.attributeCombination),
      v.id,
    );
  }

  // Classify existing variants
  const toPreserve: string[] = [];
  const toDeactivate: string[] = [];

  for (const [fp, id] of existingFingerprintMap) {
    if (newFingerprints.has(fp)) {
      toPreserve.push(id);
    } else {
      toDeactivate.push(id);
    }
  }

  // Find new combinations that don't have an existing variant
  const toAdd: VariantMatrixEntry[] = [];
  for (const newCombo of newCombinations) {
    const fp = variantFingerprint(newCombo.attributeCombination);
    if (!existingFingerprintMap.has(fp)) {
      toAdd.push(newCombo);
    }
  }

  return { toPreserve, toDeactivate, toAdd };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Computes the Cartesian product of an array of arrays.
 */
function cartesianProduct<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) => {
      return acc.flatMap((a) => curr.map((b) => [...a, b]));
    },
    [[]],
  );
}
