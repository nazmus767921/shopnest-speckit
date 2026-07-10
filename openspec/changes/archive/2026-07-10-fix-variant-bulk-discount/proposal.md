## Why

The product variant bulk editor fails to apply percent-based discounts correctly because the `NumberInput` component's default minimum value blocks negative inputs (e.g., `-10` for a 10% discount). This prevents merchants from applying quick presets (such as a 10% or 20% discount) or manually entering negative percentage adjustments, even though the server-side action properly handles signed percentages to reduce prices.

## What Changes

- Modify `VariantBulkToolbar` to explicitly pass correct `minValue` constraints to the `NumberInput` components depending on the selected price adjustment/compare-at price adjustment types:
  - `fixed` type uses `minValue={0}` (prevents negative base prices).
  - `percent` type uses `minValue={-100}` (allows percentage discounts down to -100%).
  - `add_amount` type uses `minValue={undefined}` (allows negative and positive price adjustments).

## Capabilities

### New Capabilities
*None*

### Modified Capabilities
*None*

## Impact

- **Affected Components**: [VariantBulkToolbar.tsx](file:///C:/Users/Admin/Desktop/Projects/running/shopnest-speckit/components/dashboard/product-variant-editor/VariantBulkToolbar.tsx) price and old price inputs.
- **Affected User Flow**: Bulk variant price adjustment inputs and quick discount preset clicks now successfully allow and hold negative values.
