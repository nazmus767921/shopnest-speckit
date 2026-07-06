## Why

Product cards across the storefront (PLP grids, carousels, related items) expose a direct "Add to Cart" button that adds a product without variant selection. Since all products support variants (size, color), this silently creates cart items with no variant data — corrupting order payloads, causing fulfillment errors, and degrading the customer experience. This must be fixed before variants roll out fully to production merchants.

## What Changes

- **BREAKING**: The "Add to Cart" button on `ProductCard` no longer directly adds an item to cart. It now opens a variant-selection dialog.
- New `VariantQuickSelectDialog` client component added — a modal that surfaces variant pickers (color swatches, size pills) and a quantity stepper matching the PDP UX, followed by an "Add to Cart" CTA.
- Dialog is responsive: bottom-sheet on mobile, centered modal on desktop.
- All dialog surface tokens (`--dialog-bg`, `--dialog-overlay`, `--dialog-radius`, `--dialog-border`) are registered in `global.css` so the component automatically re-skins when the active store theme changes.
- `ProductCard` becomes a thin shell that owns only image, title, price, and rating — variant selection fully delegated to the dialog.
- The dialog reads variant stock from the existing product data shape; no new API endpoints are needed.

## Capabilities

### New Capabilities

- `product-card-variant-dialog`: The `VariantQuickSelectDialog` component — variant picker (color swatches + size pills), quantity stepper, and Add to Cart action — surfaced from the product card Add to Cart trigger. Fully theme-token driven and responsive.

### Modified Capabilities

- `pdp-variant-and-actions`: The variant picker and quantity stepper UI patterns defined for PDP are now reused verbatim (same tokens, same interaction model) inside the dialog; the spec must confirm those patterns are designed for reuse, not PDP-exclusive.

## Impact

- **Storefront ProductCard component** (`components/storefront/product-card.*`): Add to Cart click handler replaced with dialog trigger.
- **New dialog component** (`components/storefront/variant-quick-select-dialog.*`): Client component wrapping variant pickers, stepper, and cart action.
- **`global.css`**: New CSS custom properties for dialog tokens (`--dialog-bg`, `--dialog-overlay`, `--dialog-radius`, `--dialog-border`, `--dialog-shadow`) hooked into existing theme variable structure.
- **Cart store / Server Action**: No change — dialog re-uses the existing `addToCart` action with a valid `{ variantId, quantity }` payload.
- **No database schema changes**: Variant data is already part of the product model.
- **Dependencies**: No new packages — uses existing Radix Dialog primitive (or equivalent) already in the component library.
