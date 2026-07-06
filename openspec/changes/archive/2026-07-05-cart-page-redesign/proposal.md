## Why

The storefront template's cart page layout deviates from the mobile-first, high-contrast, bold design requirements of SHOP.CO. The item rows are cluttered with redundant row totals instead of clean unit prices, size/color variant tags are merged rather than displayed on separate lines, and the layout doesn't group the trash icon and quantity stepper properly. Additionally, the order summary lacks the interactive promo code functionality and flat delivery fee calculations shown in the target design.

## What Changes

- **Breadcrumbs & Typography**: Add `Home > Cart` breadcrumbs and adjust headers to match the uppercase, geometric, high-contrast styling.
- **Cart Item Row Restructuring**: Re-architect `CartItemRow.tsx` to group the image on the left, details (title, parsed size, parsed color, unit price) in the middle, and controls (red trash icon at the top, pill quantity stepper at the bottom) on the far right.
- **Interactive Promo Codes**: Implement coupon code application state in `CartClientPage.tsx` that supports applying discount codes (such as `DISCOUNT20` for 20% off), showing the calculated discount row in red, and computing the grand total.
- **Order Summary Pricing**: Set delivery fee to a flat `৳15.00` (or `1500` paisa) and calculate the final total as `Subtotal - Discount + Delivery Fee`.

## Capabilities

### New Capabilities
- `cart-layout-overhaul`: Implements the 1-to-1 cart item row redesign with parsed variants, unit price alignment, breadcrumbs, and aligned checkout navigation.
- `cart-promo-calculation`: Implements client-side promo code application, discount row rendering, and updated summary total calculations.

### Modified Capabilities

## Impact

- **Affected Areas**: `components/storefront/CartClientPage.tsx` and `components/storefront/CartItemRow.tsx`.
