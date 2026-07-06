## 1. Redesign Cart Item Row layout in CartItemRow.tsx

- [x] 1.1 Adjust storefront layout `layout.tsx` wrapper class to `max-w-7xl px-4 md:px-8` to expand container width.
- [x] 1.2 Modify `CartItemRow.tsx` row padding to `py-6 md:py-8` and flex gaps to `gap-4 md:gap-6`.
- [x] 1.3 Increase cart product image thumbnail size to `w-28 h-28 md:w-32 md:h-32` and apply `rounded-[12px]`.
- [x] 1.4 Refine `CartItemRow.tsx` typography to use premium sans-serif (Satoshi) for product names and details.
- [x] 1.5 Group and align control columns in `CartItemRow.tsx` (top-right red delete icon, bottom-right stepper height `h-10 md:h-11 px-3 md:px-5`).

## 2. Implement Interactive Promo Code & Summary Calculations in CartClientPage.tsx

- [x] 2.1 Refine `CartClientPage.tsx` main wrapper max width to `max-w-7xl` and gaps to `gap-6 md:gap-8`.
- [x] 2.2 Format breadcrumbs and render uppercase `"YOUR CART"` main heading with massive display font.
- [x] 2.3 Style items list and summary cards to use `border border-hairline-light rounded-[20px] bg-white p-6 md:p-8`.
- [x] 2.4 Style `"Order Summary"` section headers using Satoshi (sans-serif) instead of display font.
- [x] 2.5 Style the promo code input row and Apply button (height `h-12` and pill rounded).
- [x] 2.6 Style the Checkout CTA button as a black pill with height `h-14` and arrow-right icon.
