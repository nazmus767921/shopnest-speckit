## 1. Global CSS Design Tokens

- [x] 1.1 Add `--color-discount-bg`, `--color-discount-text`, and `--color-rating-star` design tokens to `.storefront-theme-default` in `app/globals.css`.

## 2. Component Refactoring

- [x] 2.1 Add an `iconOnly?: boolean` prop to `AddToCartButton` in `components/storefront/AddToCartButton.tsx` and style it as a rounded-full icon button when enabled.
- [x] 2.2 Redesign `components/storefront/ProductCard.tsx` to align texts and stars to the left.
- [x] 2.3 Add stars rating block and average rating text (e.g., `3.5/5`) on the card below the title.
- [x] 2.4 Remove the bottom text-based button action container containing Add to Cart and Buy Now.
- [x] 2.5 Place the icon-only Add to Cart button to the right of the pricing row.
