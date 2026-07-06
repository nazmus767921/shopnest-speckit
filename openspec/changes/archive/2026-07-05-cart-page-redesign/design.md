## Context

The current storefront cart page and items list do not match the target SHOP.CO styling and features. The item row layouts lack proper spacing, variant details are clumped, unit prices are missing in favor of row subtotals, and the order summary is missing active promo code functionality. We need to redesign the cart components to conform to the design tokens and layout rules defined in `context/storefront/DESIGN.md`.

## Goals / Non-Goals

**Goals:**
- Implement a 1-to-1 visual redesign of the cart list and individual cart item rows for mobile and desktop viewports.
- Split variant labels (e.g. `"Size: M, Color: Red"`) and render each attribute on its own line.
- Implement an interactive client-side promo code system (`useState`) that validates codes (like `DISCOUNT20` or `SHOP20` for 20% off) and calculates discounts, flat delivery fees, and grand totals.
- Maintain styling boundaries strictly inside the `.storefront-theme-default` scope.

**Non-Goals:**
- Storing applied promo codes in the backend database (out of scope, client-side session state only).
- Altering the checkout workflow or payment gateway integrations.

## Decisions

### 1. Flex Layout Restructuring of `CartItemRow.tsx`
- We will restructure the item row into a flexible structure:
  - **Left column**: Large thumbnail (`h-24 w-24 md:h-32 md:w-32`) with a light gray product backdrop (`bg-surface-product` / `#F0EEED`) and a rounded border.
  - **Middle column**: Stacked title, parsed variant attributes (rendered line-by-line using `variantLabel.split(", ")`), and the unit price (`formatTaka(item.pricePaisa)`) at the bottom.
  - **Right column**: Red delete trash bin icon aligned to the top-right, and the quantity stepper pill aligned to the bottom-right.

### 2. Client-Side Promo Code State in `CartClientPage.tsx`
- We will introduce state hooks inside `CartClientPage`:
  - `promoInput`: current text typed by the user.
  - `appliedPromoCode`: string containing the successfully applied code, or `null`.
  - `discountPercent`: active discount percent (defaults to `0`, sets to `20` upon applying `DISCOUNT20` / `SHOP20` / `20OFF`).
  - `promoError`: validation error message if the code is invalid.
- Calculate:
  - `discountPaisa = (subtotalPaisa * discountPercent) / 100`
  - `deliveryPaisa = 1500` (flat 15 Taka) if subtotal > 0.
  - `totalPaisa = subtotalPaisa - discountPaisa + deliveryPaisa`.

### 3. High-Contrast Typography & Visuals
- Add breadcrumbs (`Home > Cart`) at the top of the page using small typography (`text-storefront-body-md text-shade-40`).
- Ensure the header uses uppercase style (`YOUR CART`) with display typography.
- Group the promo code text input (complete with tag icon) and "Apply" button inline on a single row.
- Render the final checkout button as a full-width black pill with a right arrow icon, labeled `"Go to Checkout"`.

## Risks / Trade-offs

- **[Risk] Styling Conflicts with Main ShopNest Site** → *Mitigation:* Ensure all redesigned styles are enclosed inside the scoped classes of `.storefront-theme-default` or leverage existing `.btn-storefront-*`/`.card-storefront-*` utility classes.
- **[Risk] Missing Promo Code Database Integration** → *Mitigation:* Document clearly in specs that promo codes are handled as client-side session/cart discounts for checkout mapping.
