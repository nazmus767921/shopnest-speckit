# Contract: Variant Matrix Library

**File**: `lib/products/variants.ts`

## generateVariantMatrix

Pure function that computes the Cartesian product of attribute options to
produce the variant matrix.

```typescript
type AttributeInput = {
  id: string;
  name: string;
  options: Array<{
    id: string;
    label: string;
    value: string;
  }>;
};

type VariantMatrixEntry = {
  attributeCombination: Record<string, string>; // e.g., { Color: "red", Size: "m" }
  label: string;                                // e.g., "Red / M"
  sku: string;                                  // auto-generated
  price: number | null;                         // null = inherit base
  stockCount: number;                           // defaults to 0
  isActive: boolean;                            // defaults to true
};

function generateVariantMatrix(
  attributes: AttributeInput[],
  baseSku: string,
  basePrice: number
): VariantMatrixEntry[]
```

**Preconditions**:
- `attributes` length ≤ 3
- Each attribute has ≥ 1 option, each option has non-empty `label` and `value`
- Product of all option counts ≤ 1000

**Postconditions**:
- Returns one entry per combination in the Cartesian product
- Each entry has a unique auto-generated SKU: `{baseSku}-{opt1val}-{opt2val}-...`
- `price` is `null` by default (inherit base)
- `stockCount` is `0` by default
- `isActive` is `true` by default

**Pure**: No side effects. No I/O. Deterministic for same inputs.

---

## smartMergeVariants

Pure function that computes the diff between old and new attribute configurations,
returning a merge plan for existing variants. This is the core of the smart merge
feature — it ensures merchants don't lose per-variant customizations when adding
or removing attribute options.

```typescript
type SmartMergeResult = {
  toPreserve: Array<{ variantId: string }>;
  toDeactivate: Array<{ variantId: string; reason: string }>;
  toAdd: Array<{
    attributeCombination: Record<string, string>;
    label: string;
    sku: string;
    price: number | null;
    stockCount: number;
  }>;
};

function smartMergeVariants(
  oldAttributes: AttributeInput[],
  newAttributes: AttributeInput[],
  existingVariants: Array<{
    id: string;
    attributeCombination: Record<string, string>;
    price: number | null;
    stockCount: number;
    isActive: boolean;
    sku: string;
  }>,
  baseSku: string,
  basePrice: number
): SmartMergeResult
```

**Algorithm**:
1. Compute old matrix combinations (Cartesian product of old attribute options)
2. Compute new matrix combinations (Cartesian product of new attribute options)
3. For each new combination:
   - Match against existing variants by attribute combination
   - If match found → `toPreserve` (keep variant id, preserve price/stock/SKU edits)
   - If no match → `toAdd` (generate with defaults: base price, auto SKU, stock=0)
4. For each existing variant:
   - If its combination is NOT in any new combination → `toDeactivate`
   - All other existing variants → automatically in `toPreserve` (unchanged)

**Pure**: No side effects. Deterministic for same inputs.

---

## generateSku

Generates an auto-SKU from a base SKU and attribute combination values.

```typescript
function generateSku(baseSku: string, optionValues: string[]): string
```

Example: `generateSku("DRE-001", ["red", "m"])` → `"DRE-001-RED-M"`

---

## selectVariantForOptions

Given a set of selected attribute values and all variants, returns the matching
variant or null.

```typescript
type VariantSummary = {
  id: string;
  sku: string;
  price: number | null;
  stockCount: number;
  isActive: boolean;
  attributeCombination: Record<string, string>;
};

function selectVariantForOptions(
  variants: VariantSummary[],
  selectedOptions: Record<string, string>
): VariantSummary | null
```

**Preconditions**:
- `selectedOptions` has an entry for every attribute key present in variants

**Postconditions**:
- Returns the variant whose `attributeCombination` exactly matches `selectedOptions`
- Returns `null` if no match or matching variant is not active

**Pure**: No side effects.
