## 1. Unit Testing (TDD)

- [x] 1.1 Add schema validation test in `bulkAndFilter.test.ts` to ensure negative values down to -100 are accepted for percentage price adjustments (both price and compare-at price).
- [x] 1.2 Add schema validation test to ensure negative values are accepted for add_amount price adjustments.
- [x] 1.3 Add schema validation test to ensure negative values are rejected for fixed price adjustments.

## 2. Implementation

- [x] 2.1 Update `priceAdjustment` `minValue` calculation in [VariantBulkToolbar.tsx](file:///C:/Users/Admin/Desktop/Projects/running/shopnest-speckit/components/dashboard/product-variant-editor/VariantBulkToolbar.tsx#L330-L338) based on `priceType` (`fixed` -> 0, `percent` -> -100, `add_amount` -> undefined).
- [x] 2.2 Update `compareAtPriceAdjustment` `minValue` calculation in [VariantBulkToolbar.tsx](file:///C:/Users/Admin/Desktop/Projects/running/shopnest-speckit/components/dashboard/product-variant-editor/VariantBulkToolbar.tsx#L363-L373) based on `compareAtPriceType` (`fixed` -> 0, `percent` -> -100, `add_amount` -> undefined).

## 3. Verification

- [x] 3.1 Run unit tests using `bun test` and ensure all tests pass.
- [x] 3.2 Manually verify that quick discount presets (10% and 20%) populate negative values successfully in the inputs.
