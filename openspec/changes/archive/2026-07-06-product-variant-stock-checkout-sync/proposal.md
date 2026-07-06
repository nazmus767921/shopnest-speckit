## Why

When products utilize variants, key parameters like stock levels and custom variant pricing become distributed rather than monolithic. Currently, editing a product's details overwrites its stock levels with a stale value from the dashboard form, storefront product rows display interactive steppers that let merchants manually corrupt base stock levels, and order checkout subtotals fail to incorporate variant price overrides, leading to subtotal and payment mismatches.

## What Changes

- **BREAKING**: Submitting the product creation or edit form (`ProductForm`) for a product with variants will ignore the simple `stockCount` field and instead compute the accumulated sum of active variant stock counts.
- **BREAKING**: Placing an order with variant items will resolve pricing at checkout using the specific variant overrides rather than the base product price.
- **NEW FEATURE**: Support strike-through / discount pricing by adding an optional "Old Price" (compare-at price) alongside the "Sell Price" (current price) at both the parent product level and individual variant level.
- **MODIFICATION**: The merchant product management page row removes the interactive stock stepper widget (`InlineStockWidget`) for variant-enabled products to prevent accidental base stock overrides, rendering a read-only sum instead.
- **AUTOMATION**: Updating variant stock levels through single updates, bulk actions, or attribute matrix regeneration will automatically synchronize the parent product's `stockCount` field.

## Capabilities

### New Capabilities

- `product-variant-inventory-sync`: Automatic calculation and synchronization of parent product stock count from variant levels across creation, modification, checkout decrements, and cancel restorations.

### Modified Capabilities

- `pdp-variant-and-actions`: Checkout price calculations must explicitly resolve variant price overrides if selected, falling back to base price, to prevent order total mismatches. In addition, PDP and storefront cards must support displaying strike-through discount pricing using the new old price (compare-at price) when available on both product and variant selections.

## Impact

- **Database Schema Changes**: Add `compareAtPricePaisa` (integer, nullable) to both `products` and `product_variants` tables to store the old price/strike price.
- **Database Queries & Actions**:
  - `updateProduct` in `db/queries/products.ts` and `updateProductAction` in `app/actions/products.ts` will calculate and persist the variant stock sum rather than accepting form-level simple stock count values when variants exist. They will also handle updating the product-level compare-at price.
  - `createOrder` and cancellation/restore stock logic in `db/queries/orders.ts` will calculate correct subtotals using variant prices and update parent product stock count alongside variant stock updates.
  - Actions in `app/actions/variants.ts` will trigger parent product stock synchronization after variant operations and support updating the variant-level compare-at price.
- **Storefront Dashboard**:
  - `ProductsClient.tsx` will display a read-only stock indicator badge for variant products instead of rendering the interactive `InlineStockWidget`.
  - Dashboard product form and variant editors will expose new inputs for configuring the optional old price (compare-at price).

