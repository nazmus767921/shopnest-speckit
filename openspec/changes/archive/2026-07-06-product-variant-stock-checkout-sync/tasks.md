## 1. TDD / Failing Tests Preparation

- [x] 1.1 Write a failing unit/integration test in `db/queries/__tests__/orders.test.ts` to assert that creating an order with variants resolves correct variant prices and computes the order subtotal using the variant price overrides instead of the base product price.
- [x] 1.2 Write a failing test to assert that decrementing a variant's stock during checkout or incrementing it on order cancellation correctly updates the parent product's accumulated `stockCount`.
- [x] 1.3 Write a failing test in `app/actions/__tests__/variants.test.ts` to assert that adding, editing, or bulk updating variant stock counts triggers a sync update of the parent product's `stockCount`.
- [x] 1.4 Write failing tests to assert that `compareAtPricePaisa` is correctly saved and fetched at both the product level and variant level.

## 2. Database Schema and Validation Updates

- [x] 2.1 Update `products` table in `db/schema.ts` to add `compareAtPricePaisa: integer("compare_at_price_paisa")`.
- [x] 2.2 Update `productVariants` table in `db/schema.ts` to add `compareAtPricePaisa: integer("compare_at_price_paisa")`.
- [x] 2.3 Update validation schema `productFormSchema` in `lib/validations/products.ts` to include optional `compareAtPrice` field.
- [x] 2.4 Update validation schemas for variants in `lib/validations/variants.ts` to include optional `compareAtPrice` / `compareAtPricePaisa`.

## 3. Database Sync Helper & Product Updating Safeguard

- [x] 3.1 Implement `syncParentProductStock(tx, productId)` helper in `db/queries/products.ts` to sum stock of all active product variants and update the parent product's `stockCount`.
- [x] 3.2 Update `updateProduct` in `db/queries/products.ts` to check if `existingProduct.hasVariants` is true. If true, remove `stockCount` from the updates object and run the sync helper inside the transaction.
- [x] 3.3 Update `updateProduct` and `createProduct` in `db/queries/products.ts` to save and update the product-level `compareAtPricePaisa`.

## 4. Checkout Price & Stock Alignment

- [x] 4.1 Refactor the checkout item loop in `createOrder` (`db/queries/orders.ts`) to fetch product and variant details in a single query with row-level locks, correctly resolving variant price overrides.
- [x] 4.2 Update `createOrder` to calculate `itemsSubtotal` using the resolved unit prices (using variant price override where applicable).
- [x] 4.3 Add stock synchronization call `syncParentProductStock(tx, item.productId)` immediately after decrementing variant stock in `createOrder`.
- [x] 4.4 Add stock synchronization call `syncParentProductStock(tx, item.productId)` immediately after incrementing variant stock on order cancellation/return.

## 5. Variant Actions Sync

- [x] 5.1 Update `saveProductAttributesAction` in `app/actions/variants.ts` to calculate and save the parent product's accumulated `stockCount` in step 6.
- [x] 5.2 Update `updateVariantAction` in `app/actions/variants.ts` to execute parent product stock synchronization after updating a single variant, and persist `compareAtPricePaisa`.
- [x] 5.3 Update `bulkUpdateVariantsAction` in `app/actions/variants.ts` to execute parent product stock synchronization for the affected product after bulk updates, and support bulk updating compare-at price overrides.

## 6. Storefront Dashboard Products & Variant UI

- [x] 6.1 Add `hasVariants: boolean` and `compareAtPrice: number | null` to the `FormattedProduct` interface in `ProductsClient.tsx`.
- [x] 6.2 Modify the table view column rendering in `ProductsClient.tsx` to conditionally render a read-only stock badge with a `(Variants)` indicator and warning status dot if `product.hasVariants` is true.
- [x] 6.3 Modify the mobile grid view stock row in `ProductsClient.tsx` to conditionally render the same read-only indicator if `product.hasVariants` is true.
- [x] 6.4 Expose an optional "Old Price (BDT)" field in the `ProductForm` UI (Product Info tab), mapped to compare-at price.
- [x] 6.5 Add "Old Price" column input and bulk action options inside the `VariantsSection` and `VariantRowEditor` components.

## 7. Storefront Display & Checkout Integration

- [x] 7.1 Update storefront `ProductCard` to display a strike-through compare-at price next to the sell price if configured.
- [x] 7.2 Update PDP page and PDP pricing section to display the comparison strike-through price, updating dynamically based on variant selection overrides.
- [x] 7.3 Update checkout order preview page to verify pricing display layout doesn't conflict with discount presentation.

## 8. Integration Verification & Testing

- [x] 8.1 Run the full vitest suite to ensure all TDD tests pass successfully and verify there are no regressions.
- [x] 8.2 Manually test in the dashboard that editing product description/name under Product Info tab does not corrupt the accumulated variant stock count.
- [x] 8.3 Manually test storefront checkout with mixed simple and variant cart items to verify total order pricing matches item sums.

