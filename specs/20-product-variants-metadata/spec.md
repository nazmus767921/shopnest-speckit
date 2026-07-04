# Feature Specification: Product Variants & Custom Metadata

**Feature Branch**: `20-product-variants-metadata`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "Extend the product to include variants feature, per-product custom metadata. Variants should be auto-generated based on custom attributes. The system will auto-generate the variants matrix and let the user specify info per variant."

## User Scenarios & Testing

### User Story 1 - Define Custom Attributes & Auto-Generate Variant Matrix (Priority: P1)

As a merchant, I want to define custom attributes (e.g., Color, Size, Material) with their options (e.g., Red, Blue, S, M, L) on a product, so the system auto-generates the full variant matrix (e.g., Red/S, Red/M, Red/L, Blue/S, Blue/M, Blue/L) and I can set price, stock, SKU, and images per variant.

**Why this priority**: This is the core value proposition — without auto-generated variant matrices, merchants would have to create each variant manually as a separate product, defeating the purpose.

**Independent Test**: Can be fully tested by creating a product with attributes Color=[Red, Blue] and Size=[S, M], verifying 4 variants are auto-generated, then editing per-variant price and stock.

**Acceptance Scenarios**:

1. **Given** a merchant is on the Add/Edit Product page with the variant table area visible, **When** they tap "Add Attribute", **Then** a new row appears with an attribute name input on the left, a tag input in the center (type option names, press Enter to add as a removable pill — no separate "Generate" step), and a three-dot menu on the far right with "Delete" and "Display Type" options. After adding two attributes (e.g., "Size" with "S", "M", "L" and "Color" with "Red", "Blue"), the variant table instantly populates 6 rows below — no page reload, no separate "Generate" button.
2. **Given** the variant table is displayed, **When** the merchant clicks directly on any cell (SKU, price, or stock), **Then** the cell becomes editable inline immediately — no expand/collapse or separate edit mode needed. Press Enter to confirm, Tab to confirm and move to next cell, click away (blur) to confirm. Escape reverts to the original value. Each edit auto-saves on confirm/blur.
3. **Given** a variant's stock is set to 0, **When** a customer views the storefront, **Then** that specific variant shows as out-of-stock and cannot be added to cart.

---

### User Story 2 - Per-Product Custom Metadata Fields (Priority: P1)

As a merchant, I want to add custom metadata fields to a product (e.g., "Fabric: Cotton", "Care: Machine Wash", "Fit: Regular") to display additional product information that doesn't fit the standard fields.

**Why this priority**: Custom metadata is the simplest part of the feature and provides immediate value for merchants to showcase product-specific details.

**Independent Test**: Can be tested by adding 3 custom metadata key-value pairs to a product and verifying they display on the storefront product page.

**Acceptance Scenarios**:

1. **Given** a merchant is editing a product, **When** they add a custom metadata field (key: "Fabric", value: "Cotton"), **Then** the field is saved and displayed on the storefront product detail page.
2. **Given** a product has 5 metadata fields, **When** the storefront renders, **Then** all fields are displayed in a structured metadata section.

---

### User Story 3 - Variant-Aware Cart & Checkout (Priority: P2)

As a customer, I want to select a specific variant (e.g., Red, Size M) when adding a product to cart, so the cart and checkout reflect the correct variant's SKU, price, and stock.

**Why this priority**: Without variant-aware cart, customers could add the base product without specifying which variant they want.

**Independent Test**: Can be tested by selecting variant "Red/S" and verifying the cart shows the correct variant SKU, price, and image.

**Acceptance Scenarios**:

1. **Given** a product has color and size variants, **When** a customer selects "Red" and "M" and clicks "Add to Cart", **Then** the cart item shows the Red/M variant with its specific SKU and price.
2. **Given** two variants have different prices, **When** a customer adds the cheaper variant to cart, **Then** the cart total reflects the cheaper variant's price.

---

### User Story 4 - Variant Inventory & Stock Tracking (Priority: P2)

As a merchant, I want per-variant stock tracking so inventory is accurate at the variant level, and the storefront only shows available variants.

**Why this priority**: Stock accuracy is a ShopNest invariant (stock must never go below zero). This extends that invariant to variants.

**Independent Test**: Can be tested by setting variant Blue/L stock to 3, buying 2, and verifying stock drops to 1 and a third purchase of 2 is rejected.

**Acceptance Scenarios**:

1. **Given** variant Blue/L has stock 3 and a customer buys 2, **Then** variant Blue/L stock becomes 1.
2. **Given** variant Red/S has stock 0, **When** a customer views the product page, **Then** the Red/S option is shown as unavailable and cannot be selected.

---

### User Story 5 - Variant Management in Merchant Dashboard (Priority: P3)

As a merchant, I want to add, edit, or remove variants from the product management dashboard, and update per-variant pricing in bulk.

**Why this priority**: Without dashboard management, the feature is unusable in production.

**Independent Test**: Can be tested by editing a variant's price from the dashboard and verifying the storefront reflects the new price.

**Acceptance Scenarios**:

1. **Given** a merchant is on the product edit page, **When** they change the price of variant Red/L from ৳500 to ৳550, **Then** the storefront displays ৳550 for Red/L.
2. **Given** a merchant removes the "Blue" option from the Color attribute via the chip input, **When** the merchant confirms the warning dialog ("Removing 'Blue' will delete 2 variants with custom pricing"), **Then** all Blue variants are cascade-deleted from the database, active carts referencing Blue variants show a "No longer available" notice and the customer must remove them before checkout, and historical orders retain their variant snapshot unchanged.
3. **Given** a product has 6 variants (Color×Size=3×2), **When** the merchant checks 3 variants and applies "+10%" price adjustment from the bulk toolbar, **Then** only the selected 3 variants show updated prices and the other 3 remain unchanged.
4. **Given** a product has 27 variants (3 attributes × 3 options each), **When** the merchant selects "Color: Red" in the filter bar, **Then** only the 9 Red/* variants are shown and the variant count indicator reads "9 of 27."
5. **Given** a merchant deletes an entire attribute (e.g., "Color") via the three-dot → Delete Attribute menu, **When** the merchant confirms the warning dialog ("Delete 'Color' and its 6 associated variants? This cannot be undone."), **Then** all variants referencing that attribute's options are cascade-deleted, active carts referencing those variants show "No longer available" and must be removed before checkout.
6. **Given** the last attribute on a product is cascade-deleted, **When** zero variants remain, **Then** the product automatically reverts to non-variant mode (`has_variants = false`) and the base product price/SKU/stock becomes the primary surface.

## Requirements

### Functional Requirements

- **FR-001**: The attribute editor MUST use a dynamic row pattern. Tapping "Add Attribute" inserts a new row containing:
  - **Left**: An inline text input for the attribute name (e.g., "Color", "Size").
  - **Center**: A tag/chip input for option values. Type an option name and press **Enter** to add it as a removable pill/ chip. Space behaves normally (allows multi-word option values like "Extra Large"). Press × on a chip to remove it. Press Backspace in an empty input to remove the last chip.
  - **Right**: A **three-dot (⋮) menu** with at least "Delete Attribute" and "Display Type" (swatch / dropdown / radio) options.
  Rows are collapsible and reorderable. No separate "Add option" wizard or modal.
- **FR-002**: The system MUST auto-generate the full variant matrix from the Cartesian product of all attribute options. Variant rows MUST appear within 50ms of a chip change in the same view as the attribute editor — **no separate "Generate" button**, no page navigation. Chip changes (add/remove options) auto-persist to the server after a short debounce (≤500ms from last chip change). The matrix update is optimistic — rows appear immediately while persisting in the background.
- **FR-003**: Each variant MUST have its own SKU, price (defaults to base product price), stock count, and optional images.
- **FR-004**: The variant table MUST use **direct inline cell editing** — no expand/collapse, no separate edit mode. Click any cell (SKU, price, stock) to enter edit mode instantly. Press Enter to confirm the edit and save, Tab to confirm and move to the next cell, or click away (blur) to confirm. Escape reverts to the original value. Each confirm/blur triggers an immediate auto-save (no "Save" button required). Each cell shows a subtle green flash on successful save and red highlight + error message on failure.
- **FR-005**: Products MUST have a `has_variants` flag; when true, the base product is not orderable — only variants are.
- **FR-006**: Merchants MUST be able to add custom metadata key-value pairs to a product (not per variant in v1).
- **FR-007**: Custom metadata MUST display on the storefront product detail page.
- **FR-008**: The storefront product page MUST show variant selectors (dropdowns, swatches, or radio groups) when a product has variants.
- **FR-009**: Cart and checkout MUST track which variant was selected, including variant SKU and price.
- **FR-010**: Stock MUST be tracked per variant. Decrementing variant stock MUST use a Postgres transaction with `WHERE stock_count >= quantity` guard.
- **FR-011**: Existing products without variants MUST continue to work unchanged.
- **FR-012**: The product schema in the DB MUST allow both variant and non-variant products.
- **FR-013**: Maximum 3 custom attributes per product, maximum 10 option values per
  attribute (max theoretical variants: 1000). This prevents matrix explosion
  while supporting realistic use cases (Color × Size × Material).
- **FR-015**: The variant table MUST include a bulk toolbar with checkbox column selection for:
  - Price adjustment — options: (a) set fixed price, (b) apply ±% based on each variant\'s current price (e.g., +10% on price 500 = 550), (c) apply ±amount in currency units (e.g., +50 on price 500 = 550). All adjustments are calculated relative to each variant\'s existing price at the time of the operation
  - Stock set (set all selected variants to a stock count)
  - SKU prefix change for selected variants
  - Bulk deactivate/activate selected variants
- **FR-016**: The variant table MUST include a search/filter bar to:
  - Filter by attribute combination (e.g., "Color: Red")
  - Search by SKU partial match
  - Filter by stock level (in stock / out of stock / low stock)
- **FR-014**: Variant images MUST be uploaded per variant using path:
  `product-images/{merchant_id}/{product_id}/variants/{variant_id}/{uuid}.{ext}`.
  Image count and size limits follow the same plan-based rules as base product
  images (Starter: 2 images per variant, 1MB per image file; Growth/Pro: 5 images
  per variant, 2MB per image file). Accepted formats: JPG, PNG, WebP.
- **FR-017**: The variant table editor MUST support full keyboard navigation — Tab between cells, Enter to edit, Escape to cancel, Arrow keys for cell navigation. ARIA roles (`role="grid"`, `role="gridcell"`) MUST be applied. Screen readers MUST announce variant count changes, edit state, and selection state via live regions.
- **FR-018**: Deleting an attribute MUST cascade-delete all its options and all variants referencing those options. BEFORE deletion, show a warning dialog: "Delete '{attribute_name}' and its {N} associated variants? This cannot be undone." with Cancel/Confirm buttons. The delete operation MUST use an ON DELETE CASCADE foreign key chain (attribute → attribute_options → variant_attribute_links → product_variants) for atomic cleanup.
- **FR-019**: Removing a single option from an attribute MUST cascade-delete all variants referencing that option. BEFORE removal, show a warning dialog: "Removing '{option_value}' will delete {N} variants with custom pricing." with Cancel/Confirm buttons.
- **FR-020**: When a variant is cascade-deleted, any active cart item referencing that variant MUST display "No longer available" instead of variant details. The customer MUST remove the item before checkout can proceed. The checkout endpoint MUST reject orders containing references to deleted variants.
- **FR-021**: When the last attribute on a product is cascade-deleted and zero variants remain, the system MUST automatically set `has_variants = false`. The product's base `price`, `sku`, and `stock_count` become the primary surface again. The `variant_generation` JSON snapshot on the product MUST be cleared. No manual toggle required.
- **FR-022**: The system MUST maintain a `variant_generation` JSON snapshot on the product record that records the attribute configuration at the time of the last matrix generation. This snapshot MUST be updated whenever attribute options are added or removed. It MUST be cleared when the product auto-reverts to non-variant mode (per FR-021). The snapshot schema is defined in the data model.

### Key Entities

- **ProductAttribute**: A custom attribute definition on a product (e.g., Color, Size). Has a name and type (dropdown/swatch/etc).
- **AttributeOption**: A value within an attribute (e.g., "Red" for Color, "M" for Size).
- **ProductVariant**: A single variant generated from the attribute matrix. Has SKU, price, stock_count, images, and references to its attribute options via a variant_attribute_links junction table with ON DELETE CASCADE foreign keys.
- **ProductMetadata**: A key-value pair on a product for custom display information.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A merchant can define 2 attributes with 3 options each, auto-generate 9 variants, and set per-variant pricing in under **2 minutes** using the inline table editor — type option chips, see variants populate instantly, click cells to edit prices.
- **SC-002**: After checkout, `order_items` contains `variant_id`, `variant_label`, and the variant's SKU for every line item that was added as a variant. The order confirmation page displays the selected attribute combination (e.g., "Color: Red, Size: M").
- **SC-003**: Per-variant stock decrements atomically — no race conditions allow negative stock even under concurrent checkout.
- **SC-004**: Existing non-variant products continue to work without modification.

## Clarifications

### Session 2026-07-03

- Q: What is the target UX model for variant creation? → A: Inline table with chip options — Shopify-style. Add attributes as columns via inline "+" button, type option values as chips/pills that become removable tags. Variants populate instantly in the table below. Edit SKU, price, stock directly in editable table cells. No step wizard, no modals, no separate "Generate" button.
- Q: How should attribute modifications (add/remove options) after variants exist be handled? → A: Smart merge — add new variants for new options. When an option is removed, associated variants are cascade-deleted with a merchant warning. When an attribute is deleted, all its variants are cascade-deleted with a merchant warning. Existing price/SKU/stock overrides on surviving variants are preserved.
- Q: How should merchants navigate and bulk-edit many variants? → A: Inline table editing (click cells to edit) + bulk toolbar (checkbox selection for mass price/stock adjustments) + search/filter bar to find variants by attribute combination.

### Session 2026-07-03 (UX Refinement)

- Q: What should the attribute editor row layout be? → A: Dynamic row pattern — tap "Add Attribute" inserts a row with attribute name input (left), tag input (center, Enter-only to add tags, Space behaves normally for multi-word values), and a three-dot menu (right) with Delete and Display Type options.
- Q: Should Space also add tags in the chip input? → A: No — Enter only. Space behaves normally to allow multi-word option values (e.g., "Extra Large", "Half Sleeve").
- Q: How should variant editing work? → A: Direct inline cell editing — click any cell to edit instantly. No expand-to-edit, no separate "Edit" button. Enter/blur saves, Escape reverts. Auto-save on confirm.

### Session 2026-07-04

- Q: What enforcement model prevents orphaned variants when an attribute/option is deleted and a merchant tries to reactivate? → A: Cascade-delete — attribute deletion cascade-deletes all associated variants. Option removal cascade-deletes all variants referencing that option. Merchant sees a warning dialog summarizing affected variant count before confirmation. Manual variant toggle (is_active) is unaffected — only attribute/option removal triggers cascade.
- Q: What happens to active customer carts when a variant is cascade-deleted? → A: Cart item stays visible but shows "No longer available" notice. Customer must remove it before checkout. Checkout is blocked until all unavailable items are resolved.
- Q: Should removing a single option from an attribute cascade-delete or deactivate? → A: Cascade-delete (consistent with attribute deletion). Warning dialog shown: "Removing '{option}' will delete {N} variants with custom pricing."
- Q: How is cascade-delete enforced at the database level? → A: Foreign keys with ON DELETE CASCADE on variant─option junction tables. DB handles cleanup atomically — no application-level "forgot to clean up" bugs.
- Q: Should a product auto-revert to non-variant mode when all attributes are cascade-deleted? → A: Yes — when the last attribute is deleted and zero variants remain, `has_variants` is automatically set to `false`. Base product price/SKU/stock becomes primary surface.

## Assumptions

- Product variants are a V2 addition — the existing product catalog system is extended, not replaced.
- Variant images reuse the existing Supabase Storage `product-images` bucket with an additional variant identifier in the path.
- The merchant dashboard product edit page is extended with a "Variants" tab/section rather than a separate page.
- The "Buy Now" flow (temporary cart override) must handle variants correctly.
- The existing price snapshot invariant (`order_items.unit_price` recorded at order time) applies to variants — the selected variant's price is snapshotted, not the base product price.
