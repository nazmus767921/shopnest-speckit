## Context

Currently, ShopNest supports product variants, but parent product metadata (price, stock) does not correctly synchronize or resolve with variant-level overrides. 
- The merchant dashboard `ProductForm` submits a base `stockCount` field which overwrites the variant-accumulated stock count.
- The merchant dashboard products list table renders an interactive `InlineStockWidget` for all products, allowing merchants to edit and corrupt stock counts on parent products that actually manage stock per-variant.
- The storefront checkout creation handler `createOrder` calculates the total order subtotal using the base product price, while individual order items use the variant price override, leading to subtotal and payment mismatches.

## Goals / Non-Goals

**Goals:**
- Keep `products.stock_count` in the database synchronized with the sum of all its variant stock counts when variants exist.
- Ensure storefront order checkout subtotals and transaction amounts precisely use the variant's overridden price when variant items are selected.
- Prevent merchants from manually or accidentally modifying base product stock count in the dashboard if the product has variants.
- Support optional old price (strike-through price) alongside the active sell price at both the base product and variant levels.

**Non-Goals:**
- Modifying tax calculations or implementing generic coupon engine changes in this scope.

## Decisions

### 1. Database Schema Additions for Strike-Through Pricing
We will add `compareAtPricePaisa` as a nullable integer column to both the `products` and `productVariants` tables in `db/schema.ts`.
- `products.compareAtPricePaisa`: Stores the old/strike price of the base product.
- `productVariants.compareAtPricePaisa`: Stores the old/strike price override for a specific variant.

### 2. Centralized Parent Product Stock Syncing
We will implement a helper function `syncParentProductStock(tx, productId)` inside `db/queries/products.ts` (or importable query file) that:
- Selects the sum of `stockCount` from `productVariants` where `productId = productId` (active variants only: `isActive = true`).
- Updates the parent `products.stockCount` with this sum.
- Runs inside the provided transaction context to ensure atomic correctness.

*Alternatives considered:* Triggering this via a PostgreSQL database trigger. However, application-level transaction hooks align better with ShopNest's Drizzle ORM layout and make testing simpler.

### 3. Safeguarding `updateProduct` from Stale Stock Submissions
In `db/queries/products.ts`'s `updateProduct`:
- Check if `existingProduct.hasVariants` is true.
- If true, remove `stockCount` from the updates object (`data`) and instead compute and apply the variant sum.
- Handle mapping of decimal `compareAtPrice` from the frontend to `compareAtPricePaisa` in database updates.

### 4. Single-Pass Price & Stock Verification at Checkout
In `db/queries/orders.ts`'s `createOrder`:
- Query each cart item's product and active variant details in one pass within the transaction using a `FOR UPDATE` lock.
- Dynamically select the variant's price override if present, utilizing it to calculate both `itemsSubtotal` and `orderItemsValues` lines. This aligns the total order payment with the variant architecture.

### 5. Read-Only Variant Stock Indicators in Products List
In `ProductsClient.tsx`:
- Render a read-only badge indicating `{product.stockCount} (Variants)` and the status warning dot if `product.hasVariants` is true.
- Render the interactive `<InlineStockWidget>` only if `product.hasVariants` is false.

### 6. Storefront Discount Display Logic
- Update `ProductCard` and PDP components to display a strike-through old price in light muted gray if `compareAtPrice` is present and greater than `price` (current sell price).
- If a variant selection changes on the PDP or Quick Select Dialog, update the displayed current price and old price dynamically using the active variant's overrides.

## Risks / Trade-offs

- **[Risk] Concurrent Stock Sync Race Conditions** → *Mitigation:* Ensure all stock adjustments and parent syncs run inside a database transaction (`db.transaction`) utilizing row-level locks (`FOR UPDATE`).
- **[Risk] Stale Product list after Bulk Actions** → *Mitigation:* Ensure `revalidatePath` is called for the products pages in all actions that perform variant modifications.
- **[Risk] Invalid Old Price Range** → *Mitigation:* Add Zod validation to ensure `compareAtPrice` is strictly greater than `price` when both are defined, avoiding visual bugs where "old price" is lower than the sell price.

