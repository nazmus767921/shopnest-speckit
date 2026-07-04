# Quickstart: Product Variants & Custom Metadata

**Branch**: `20-product-variants-metadata` | **Date**: 2026-07-03

## Prerequisites

- Running dev server (`pnpm dev`)
- A merchant account with at least one product (existing, non-variant)
- Drizzle migration applied for new tables

## Setup

```bash
# 1. Generate and apply migration
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# 2. Create a test product via dashboard (or use an existing one)
#    Navigate to /dashboard/products → Add Product
```

## Validation Scenarios

### Scenario 1: Define Attributes & Auto-Generate Variants (Inline Table)

**Goal**: Verify that adding attribute chips instantly generates the variant matrix.

1. Go to `/dashboard/products/{id}/edit` → "Variants" section
2. Click "Add option like Size" above the empty variant table
3. Type "Red" → press Enter → a chip/pill appears with "Red" and a × button
4. Type "Blue" → Enter → another chip appears
5. Add another option: "Size" → type "S", "M", "L" as chips
6. **Watch the variant table below populate instantly** — no "Save" or "Generate" button needed

**Expected**: 6 variant rows appear immediately in the table:
- Red/S, Red/M, Red/L, Blue/S, Blue/M, Blue/L
- Each row shows auto-generated SKU (`{base-sku}-RED-S`), inherits base price (null), stock = 0, active status = green

**Test command**:
```bash
pnpm vitest run -- test/lib/products/variants.test.ts
# Expected: generateVariantMatrix with 2×3 options returns 6 entries
```

---

### Scenario 2: Edit Per-Variant Pricing & Stock (Inline Cell Editing)

**Goal**: Verify merchants can click cells to edit variant properties inline.

1. In the variant table, click the price cell for "Red / M"
2. Type "599" and press Enter (or Tab to next cell)
3. Click the stock cell for the same variant, type "10", press Enter
4. Click the SKU cell, type "DRE-001-RD-M", press Enter

**Expected**: Edits are saved on Enter/blur (no separate save button).
Variant "Red/M" now shows custom SKU, price ৳599, stock 10.
Variant "Red/S" still inherits base price (shows as "--" or base price) and stock 0.
Cell borders change briefly to indicate save confirmation.

**Test command**:
```bash
pnpm vitest run -- test/db/queries/variants.test.ts
# Expected: updateVariantAction updates variant fields correctly
```

---

### Scenario 3: Bulk Price Adjustment

**Goal**: Verify merchants can bulk-update variant prices using the bulk toolbar.

1. In the variant table, check the checkbox for 3 variants (e.g., all "Blue/*" variants)
2. The bulk toolbar appears at the top showing "3 selected" and action buttons
3. Click "Set Price" → enter "499" → apply
4. Verify the 3 Blue variants now show price ৳499
5. Check 2 more variants, click "Adjust Price ±%" → enter "+10" (add 10%)

**Expected**: Bulk toolbar shows when ≥1 variants selected.
Price adjustment applies only to checked variants.
All prices update instantly without page reload.

**Test command**:
```bash
pnpm vitest run -- test/app/(dashboard)/products/actions.test.ts
# Expected: bulkUpdateVariantsAction applies updates to only selected variants
```

---

### Scenario 4: Smart Merge — Adding a New Option

**Goal**: Verify existing variant edits survive when a new option is added.

1. Start with Color=[Red, Blue], Size=[S, M] → 4 variants
2. Set a custom price on "Red / S" to ৳399 and stock to 5
3. Add a new Color chip: "Green"

**Expected**:
- Red/S still shows price ৳399 and stock 5 (edit preserved)
- Red/M, Blue/S, Blue/M unchanged (still preserve any edits)
- 2 new variants appear: Green/S, Green/M (price null = inherit base, stock 0)
- Total: 6 variants

**Test command**:
```bash
pnpm vitest run -- test/lib/products/variants.test.ts
# Expected: smartMergeVariants adds only new combinations, preserves existing
```

---

### Scenario 5: Cascade-Delete — Removing an Option

**Goal**: Verify removing an option cascade-deletes affected variants with merchant warning.

1. Start with Color=[Red, Blue, Green], Size=[S, M] → 6 variants
2. Set a custom price on "Green / S" to ৳499
3. Click × on the "Green" chip to remove it

**Expected**:
- Warning dialog appears: "Removing 'Green' will delete 2 variants with custom pricing."
- Click Confirm → Green/S and Green/M are cascade-deleted from the database
- Removed variants are gone from the table entirely (not grayed out)
- Red/* and Blue/* variants still present and editable
- Historical orders with Green variants are preserved (price already snapshotted)

**Test command**:
```bash
pnpm vitest run -- test/app/(dashboard)/products/actions.test.ts
# Expected: saveProductAttributesAction cascade-deletes affected variants
#   and warns merchant before deletion
```

---

### Scenario 6: Search & Filter Variants

**Goal**: Verify merchants can find specific variants in a large matrix.

1. Create 3 attributes × 3 options = 27 variants
2. Type "Blue" in the search bar
3. Select "Size: L" from the attribute filter dropdown

**Expected**: Table filters to show only "Blue / L" variant(s).
Filter count shows "1 of 27 variants".
Clear filter to restore full table.

---

### Scenario 7: Storefront Variant Selection

**Goal**: Verify customers can select a variant and add to cart.

1. Visit the product's storefront page
2. See variant selectors for Color (swatches/3 options) and Size (dropdown/3 options)
3. Select "Red" for Color and "M" for Size
4. See price update to ৳599 and "Red/M" label appear
5. Click "Add to Cart"

**Expected**: Cart shows item with variant SKU "DRE-001-RD-M", price ৳599.
The order confirmation shows "Color: Red, Size: M" in item details.

---

### Scenario 8: Variant Stock Atomicity

**Goal**: Verify stock never goes below zero for variants.

1. Set variant "Blue/S" stock to 1
2. Open two incognito windows
3. In both windows, log in as a customer and add "Blue/S" to cart
4. Submit checkout in window 1 → succeeds
5. Submit checkout in window 2 → rejected with "insufficient stock"

**Expected**: Only one checkout succeeds. Variant "Blue/S" stock is now 0.
Product storefront shows "Blue/S" as unavailable.

---

### Scenario 9: Custom Metadata Display

**Goal**: Verify per-product metadata renders on the storefront.

1. Go to product edit → "Metadata" section
2. Add entries:
   - Key: "Fabric" → Value: "Premium Cotton"
   - Key: "Care" → Value: "Machine Wash Cold"
   - Key: "Fit" → Value: "Regular Fit"
3. Save and visit the storefront product page

**Expected**: A "Product Details" section shows:
- **Fabric**: Premium Cotton
- **Care**: Machine Wash Cold
- **Fit**: Regular Fit

---

### Scenario 10: Backward Compatibility

**Goal**: Existing non-variant products continue to work unchanged.

1. Visit a product that has no variants (has_variants = false)
2. Verify the product page renders as before (no variant selectors)
3. Add to cart and checkout normally

**Expected**: Existing product flow is completely unaffected.
`has_variants = false` products don't show variant UI.

---

## Edge Cases to Verify

| Scenario | Expected Behavior |
|----------|-------------------|
| Remove an attribute option after variants exist | Affected variants cascade-deleted (with warning dialog), not deactivated |
| Delete an entire attribute | All associated options and variants cascade-deleted (with warning dialog) |
| Last attribute deleted | Product auto-reverts to non-variant mode (has_variants = false) |
| Add a new attribute option after generation | New variants generated for new option × existing options, existing edits preserved |
| Cascade-deleted variant in active cart | Cart shows "No longer available" notice, checkout blocked until removed |
| Bulk-select 5 variants and set stock to 50 | All 5 variants show stock 50, others unchanged |
| Filter by "Color: Red" in a 27-variant matrix | Only Red/* variants shown, count updates to "9 of 27" |
| Set all attribute options to same value (Color only: Red) | Single variant generated (1×1 = 1) |
| Product with 3 attributes × 3 options each | 27 variants generated (within 1000 limit) |
| Variant with null price when base price changes | Variant inherits new base price |
| Variant with explicit price when base price changes | Variant retains its explicit price |
| Delete product with variants | All variants cascade-deleted |
| Rapidly add/remove chips (Red→×→Red→×) | Debounced — no spurious variant creation/deletion cycles |
