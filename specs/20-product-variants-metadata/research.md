# Research: Product Variants & Custom Metadata

**Branch**: `20-product-variants-metadata` | **Date**: 2026-07-03

## Decisions

### 1. Attribute/Option Limits

**Decision**: Maximum 3 attributes per product, maximum 10 option values per
attribute (max theoretical variants: 1000). This prevents matrix explosion
while supporting realistic use cases (Color × Size × Material).

**Rationale**: A clothing boutique typically needs at most Color + Size + Fit
or Color + Size + Material. 10 options per attribute covers all practical
needs (e.g., S/M/L/XL/XXL/XXXL is 6, Rainbow color palette is ~10). Beyond
1000 variants, performance degrades and merchant UX becomes unwieldy.

**Alternatives considered**:
- Unlimited: Risk of accidental 10×10×10×10×10 = 100K variant explosions
  that crash the dashboard UI and overwhelm the DB.
- Soft warning only: Merchants ignore warnings.
- Proportional to plan: Starter=1 attribute, Growth=2, Pro=3 — rejected for
  v1 of this feature (keep simple, add plan gating later if needed).

### 2. Variant Images

**Decision**: Upload per variant using path:
`product-images/{merchant_id}/{product_id}/variants/{variant_id}/{uuid}.{ext}`.
Share the same plan-based image limits as base products (Starter: 2 images,
1MB; Growth/Pro: 5 images, 2MB). Accepted formats: JPG, PNG, WebP.

**Rationale**: Per-variant images are essential for color variants (Red dress
looks different from Blue dress). Reusing the existing bucket avoids creating
new storage infrastructure. The naming convention nests under the product's
existing path, keeping all images for a product together.

**Alternatives considered**:
- Base product images only: Not sufficient for color/pattern variants where
  each variant looks visually distinct.
- Base images with variant overlays: Over-engineered for v1.
- Separate bucket: Unnecessary — single bucket with path isolation is cleaner.

### 3. Plan Limits & Variant Counting

**Decision**: The base product counts as 1 toward the product limit regardless
of how many variants it has. Per-variant pricing and stock are independent of
product count limits.

**Rationale**: Variants don't increase the number of products in the catalog
view — they're grouped under one product listing. Counting each variant as a
separate "product" would penalize merchants for using variants (the feature
they're paying for). Starter/Growth merchants may still offer variety through
variants without hitting their product cap.

**Alternatives considered**:
- Each variant counts toward product limit: Unfair — a merchant with 1 product
  × 50 variants would exceed Starter's 50 limit on a single product page.
- Variant limit per plan: Over-engineered for v1; can add as a plan feature
  later (e.g., Pro gets unlimited variants per product, Starter gets 10).

### 4. Variant SKU Generation

**Decision**: Auto-generate variant SKU from base product SKU + attribute
abbreviations (e.g., base SKU "DRE-001" → "DRE-001-RD-M" for Red/M). Merchants
can override per variant.

**Rationale**: Auto-generated SKUs prevent merchants from having to manually
enter 30+ SKUs. The pattern is intuitive and matches industry practice.

**Alternatives considered**:
- Empty SKU — merchants must fill manually: Too much friction.
- Sequential numbering (V1, V2...): Not meaningful for inventory management.
- Hash-based: Not human-readable.

### 5. Variant Price Inheritance

**Decision**: When a variant's price is not explicitly set, it inherits the
base product price. When the base price changes, variants with no explicit
price inherit the new base price. Variants with an explicitly set price retain
their price.

**Rationale**: Most variants share the same price. Only certain variants
(e.g., plus sizes) may cost more. Explicit overrides should be preserved
across base price updates.

**Alternatives considered**:
- All variants require explicit price: Too much data entry.
- Base price change cascades to all variants: Destroys deliberate pricing
  strategy (e.g., XL costs ৳100 more).

### 6. Variant Selection on Storefront

**Decision**: Use dropdown-style selectors for attributes with >5 options,
swatch-style for ≤5 options. The "Add to Cart" and "Buy Now" buttons remain
disabled until all required attributes are selected. Once all attributes are
selected, the UI shows the matching variant's price, stock status, and image.

**Rationale**: Swatches are better for visual attributes (color), dropdowns
for long lists (size). Disabling the action buttons until selection is
complete prevents invalid cart additions.

**Alternatives considered**:
- Always dropdowns: Poor UX for color selection.
- Always swatches: Breaks with 15 size options.
- Enable button with first available variant: Confusing — customer might not
  realize they selected a specific variant.

### 7. Custom Metadata Display

**Decision**: Metadata renders as a structured key-value list on the storefront
product detail page, below the description and above the reviews section (if
any). Keys render as bold labels, values as body text. Maximum 20 metadata
entries per product.

**Rationale**: Metadata is for factual product details (fabric, care, fit) that
don't fit standard fields. 20 entries covers all practical needs without
overwhelming the page.

**Alternatives considered**:
- Unlimited: Could lead to information overload.
- Render as a table: Less readable on mobile.
- Collapsible sections: Over-engineered for v1.

### 8. Variant Creation UX Model

**Decision**: Shopify-style inline table with chip option inputs. No wizard,
no modals, no separate "Generate" button. The attribute options are entered
as chips (type value → press Enter → pill appears, click × to remove).
Variant rows populate instantly in the table below as chips change. SKU, price,
and stock cells are click-to-edit inline. A bulk toolbar with checkbox
selection enables mass price/stock adjustments. A search/filter bar allows
filtering by attribute combination, SKU, or stock level.

**Rationale**: The original 3-step wizard (Define → Generate → Manage) was
explicitly criticized by the user as "too much of work" — requiring scrolling
and tapping multiple times. The inline table model eliminates step boundaries:
merchants type options and immediately see the matrix. This matches the
industry standard (Shopify, WooCommerce) and reduces the flow from 3 steps
to a single unified view.

**Alternatives considered**:
- 3-step wizard (original): Too many clicks, step transitions, separate
  "Generate" button adds cognitive overhead.
- Simplified 2-step (Define → See all): Still has an artificial step boundary.
- Side panel editor: Hides the matrix from view while editing attributes.
- Spreadsheet import: Overkill for <1000 variants and adds CSV complexity.

### 9. Cascade-Delete on Attribute/Option Removal

**Decision**: When a merchant modifies attribute options (adds "Green" to
Color, removes "Blue"), the system performs smart merge, but with
**cascade-delete** for removed options instead of deactivation:
- **New options** → Generate new variants (surviving variants preserve their
  price/SKU/stock overrides)
- **Removed options** → Cascade-delete all variants referencing the removed
  option. Merchant sees a warning dialog: "Removing 'Blue' will delete 2
  variants with custom pricing."
- **Deleted attribute** → Cascade-delete all options and variants under that
  attribute. Warning dialog: "Delete 'Color' and its 6 associated variants?
  This cannot be undone."
- **Last attribute deleted** → Auto-revert product to non-variant mode
  (`has_variants = false`).
- **Active carts** → Items referencing deleted variants show "No longer
  available" and must be removed before checkout. Historical orders retain
  their variant snapshot (price already snapshotted in order_items).

**Enforcement**: ON DELETE CASCADE foreign keys at the DB level:
`attribute → options (via attribute_id FK) → variant_attribute_links (via
attribute_option_id FK) → product_variants (via variant_id FK)`. This ensures
atomic cleanup with no application "forgot to delete" bugs.

**Rationale**: The old approach (deactivate instead of delete) created a
zombie-data problem — merchants could manually reactivate variants referencing
deleted attributes, causing a broken storefront with no attribute to display.
Cascade-delete closes this loophole entirely. Merchant warnings prevent
accidental data loss. Historical orders are safe because variant price is
snapshotted at checkout (per Invariant 3).

**Alternatives considered**:
- Deactivate (is_active = false): Creates zombie variants that can be
  reactivated even when the underlying attribute no longer exists. Storefront
  breakage.
- Block re-activation of orphaned variants: Technically possible but leaves
  dead data in the DB that can never be used again.
- Full regeneration (delete all, recreate): Destroys all per-variant edits.
- Require variant resolution before deletion: Forces merchant to manually
  deactivate/delete variants first before removing the attribute. More steps,
  same outcome as cascade-delete with warning.
- Hard-delete only, no smart merge for additions: Loses smart merge's key
  advantage of preserving existing price edits on surviving variants.

### 10. Bulk Operations & Navigation

**Decision**: The variant table includes:
- **Bulk toolbar**: Appears when ≥1 variants are checkbox-selected. Actions:
  set price (fixed or ±% / ±amount), set stock count, bulk activate/deactivate,
  bulk SKU prefix change.
- **Search/filter bar**: Filter by attribute combination (dropdown for each
  attribute value), search by SKU partial match, filter by stock level
  (in stock / out of stock / low stock).
- **Inline editing**: Click any SKU/price/stock cell to edit in place,
  confirm with Enter or blur.

**Rationale**: A product with 3×3×3 = 27 variants needs efficient filtering
and bulk editing to meet the SC-001 target (2 minutes for full setup). The
Shopify-like pattern combines individual cell editing with power-user bulk
tools.

**Alternatives considered**:
- Inline editing only: Too slow for bulk price adjustments across all variants.
- Bulk toolbar only: No way to edit individual variants without forms.
- Paginated table (20 per page): Adds navigation overhead for full-matrix
  editing. Filter/search is more useful for finding specific variants.
