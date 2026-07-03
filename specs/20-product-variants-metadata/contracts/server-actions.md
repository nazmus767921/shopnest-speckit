# Contract: Variant Server Actions

**File**: Various `app/api/` routes and Server Actions

## saveProductAttributesAction

Saves attribute definitions for a product and performs a smart merge on the variant matrix.
If the product already has variants, existing overrides (price, stock, SKU) on surviving
variants are preserved. New variants are added for new options; variants for removed options
are deactivated (not deleted).

```typescript
function saveProductAttributesAction(
  productId: string,
  attributes: Array<{
    name: string;
    displayType: 'swatch' | 'dropdown' | 'radio';
    options: Array<{ label: string; value: string; swatchColor?: string }>;
  }>
): Promise<{
  success: true;
  variantCount: number;
  variants: VariantSummary[];
} | {
  success: false;
  error: string;
}>
```

**Preconditions**:
- Authenticated merchant session with `merchant_id`
- `productId` belongs to merchant
- Attributes array length ≤ 3, each attribute options length ≤ 10
- Product of all option counts ≤ 1000

**Postconditions**:
- All previous attribute definitions and options for this product are replaced
- Smart merge applied: variants with unchanged options preserved (with edits), new combinations added, removed option combinations deactivated
- `products.variant_generation` snapshot updated with new attribute config
- `products.has_variants` is set to `true`

---

## updateVariantAction

Updates a single variant's price, stock, SKU, or active status.

```typescript
function updateVariantAction(
  variantId: string,
  data: {
    sku?: string;
    price?: number | null;  // null = inherit base
    stockCount?: number;
    isActive?: boolean;
    lowStockThreshold?: number | null;
  }
): Promise<{ success: true } | { success: false; error: string }>
```

**Preconditions**:
- Authenticated merchant session
- Variant belongs to merchant
- `stockCount` ≥ 0
- `sku` (if changing) is unique across all variants

**Postconditions**:
- Updated fields are persisted
- `products.updated_at` is bumped

---

## bulkUpdateVariantsAction

Bulk-update multiple variants in a single operation. Used by the bulk toolbar.

```typescript
function bulkUpdateVariantsAction(
  variantIds: string[],
  updates: {
    skuPrefix?: string;        // Replace SKU prefix for selected variants
    price?: number | null;     // Set fixed price
    priceAdjustment?: {        // Relative price adjustment
      type: 'percentage' | 'fixed';
      value: number;           // e.g., 10 for +10%, -5 for -5%, 50 for +50
    };
    stockCount?: number;
    isActive?: boolean;
  }
): Promise<{ success: true; updatedCount: number } | { success: false; error: string }>
```

**Preconditions**:
- Authenticated merchant session
- All `variantIds` belong to the same product and merchant
- `stockCount` ≥ 0 for all variants (if set)
- `price` ≥ 0 (if set)

**Postconditions**:
- All matching variants updated atomically in a transaction
- `products.updated_at` bumped

---

## updateVariantStockAction

Atomic stock decrement during checkout. Extends the existing stock guard to
variant stock.

```typescript
function updateVariantStockAction(
  variantId: string,
  quantity: number
): Promise<{ success: true } | { success: false; error: 'insufficient_stock' }>
```

**Preconditions**:
- Valid checkout session/cart
- `quantity` > 0

**Postconditions**:
- `stock_count` decremented atomically with `WHERE stock_count >= quantity` guard
- Transaction rolls back on insufficient stock (same invariant as base products)

---

## saveProductMetadataAction

Saves custom metadata entries for a product.

```typescript
function saveProductMetadataAction(
  productId: string,
  metadata: Array<{ key: string; value: string; sortOrder?: number }>
): Promise<{ success: true } | { success: false; error: string }>
```

**Preconditions**:
- Authenticated merchant session
- `productId` belongs to merchant
- Metadata array length ≤ 20
- Keys are non-empty, values are non-empty

**Postconditions**:
- All previous metadata entries for this product are replaced
- `products.metadata_count` is updated
