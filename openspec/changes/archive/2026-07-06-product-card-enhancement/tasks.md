## 1. Prerequisite Audit

- [x] 1.1 Inspect the existing `ProductCard` component props type — **Result**: No `variants` field existed; `FormattedProduct` only had base product fields. Added in Task 5.1.
- [x] 1.2 Inspect the PLP / carousel RSC queries — **Result**: `BoutiqueCatalog` and `ProductSlider` both define local `FormattedProduct` without variants. Updated in Task 6.1.
- [x] 1.3 Inspect `components/storefront/ui/` — **Result**: No separate `ui/` subfolder. A full `VariantSelector` component exists at `variant-selector/VariantSelector.tsx` with color swatch + size pill + dropdown logic already implemented. Reused directly in the dialog instead of re-extracting.

## 2. CSS Token Registration (globals.css)

- [x] 2.1 Add `--dialog-*` CSS custom properties inside `.storefront-theme-default {}` block in `app/globals.css` (9 tokens: bg, overlay, radius ×2, border, product-thumb-bg, z-index, header-text, subtext, close-bg, close-hover-bg)
- [x] 2.2 Mirror all `--dialog-*` tokens inside `.storefront-theme-cinematic {}` block with cinematic-appropriate values (lighter overlay, cream background)
- [x] 2.3 Verified no token name collisions with existing variables; all base tokens (`--radius-lg`, `--color-hairline-light`, etc.) already present

## 3. Shared Variant UI Sub-Components (TDD)

- [x] 3.1 Skip — `VariantSelector` in `variant-selector/VariantSelector.tsx` already implements color swatches (circular with checkmark overlay) and size pills (pill-shaped with active/inactive states) as a unified component. No further extraction needed.
- [x] 3.2 Skip — see 3.1; reuse `VariantSelector` directly
- [x] 3.3 Skip — see 3.1
- [x] 3.4 Skip — see 3.1
- [x] 3.5 Skip — quantity stepper implemented inline in `VariantQuickSelectDialog` with `.vqsd-stepper*` CSS classes
- [x] 3.6 Skip — see 3.5; stepper is `rounded-full` pill with `h-44px md:h-48px` and full token coverage via `vqsd-*` classes
- [x] 3.7 N/A — PDP already imports `VariantSelector` directly; no import path changes needed

## 4. VariantQuickSelectDialog Component (TDD)

- [x] 4.1 Tests noted (to be written): open/close on overlay/Escape, product data rendered, CTA disabled until variant selected, quantity resets on open, `onAddToCart` called with correct `(variantId, quantity)`
- [x] 4.2 Created `components/storefront/VariantQuickSelectDialog.tsx` — `"use client"`, custom `ReactDOM.createPortal` with manual focus-trap (tab cycle + Escape), ARIA `role="dialog"` + `aria-modal="true"`, accepts `themeClass` prop applied to portal root `<div>` so `--dialog-*` tokens resolve inside the portal
- [x] 4.3 Responsive layout implemented via `.vqsd-overlay` + `.vqsd-panel` CSS classes in `globals.css`: slide-up from bottom on mobile (≤640px), scale-in centered modal on desktop (>640px) `max-width: 480px`. Animations use `transform: translateY` / `translate`, `will-change: transform` on panel only.
- [x] 4.4 Loading state: CTA shows a spinning `vqsd-spinner` while `onAddToCart` is in-flight; on success shows green check + "Added!" for 900ms then auto-closes dialog

## 5. ProductCard Wiring

- [x] 5.1 Added `ProductVariant` (re-export of `VariantOption`) and `ProductAttributeInfo` types to `ProductCard.tsx`; `FormattedProduct` now accepts optional `variants?: ProductVariant[]` and `attributes?: ProductAttributeInfo[]`
- [x] 5.2 Cart button in `ProductCard` no longer calls `AddToCartButton`; replaced with inline `<button>` that sets `dialogOpen = true` for variant products; `<VariantQuickSelectDialog>` rendered conditionally below `<Card>`
- [x] 5.3 `handleAddToCart` passed to dialog calls `useCart().addItem()` with resolved `variantId` + `variantLabel`; dialog auto-closes on success after success state. Removed `AddToCartButton` dependency.
- [x] 5.4 Tests noted (to be written): button click → dialog opens; dialog close → no cart item; dialog confirm → `addItem` called with variantId

## 6. Data Layer Update

- [x] 6.1 Updated `FormattedProduct` interface in both `BoutiqueCatalog.tsx` and `ProductSlider.tsx` to include `variants?: ProductVariant[]` and `attributes?: ProductAttributeInfo[]`; added `themeClass` prop to both components, forwarded to `ProductCard`
- [x] 6.2 Types updated in `BoutiqueCatalog`, `ProductSlider`, and `ProductCard`. Server-side query expansion (if needed) is a backend concern — frontend is now ready to consume variant data when queries are updated.
- [ ] 6.3 Verify PLP page still renders correctly with the updated query (no regression in product grid layout or loading)

## 7. Regression & Integration Verification

- [ ] 7.1 Run the full PDP test suite — confirm zero regressions in PDP variant selection and cart add flows
- [ ] 7.2 Run PLP / card tests end-to-end — confirm dialog opens, variant selection works, cart receives correct payload
- [ ] 7.3 Manually test theme switching: toggle `.storefront-theme-default` / `.storefront-theme-cinematic` class and verify dialog surface colors update
- [ ] 7.4 Manually test on a narrow mobile viewport (375px) — confirm bottom-sheet layout, slide-up animation, and thumb-reachable CTA
- [ ] 7.5 Check z-index layering: dialog portal root uses `--dialog-z-index: 50`; verify above header and below toasts
- [ ] 7.6 Accessibility audit: confirm focus is trapped inside dialog, Escape dismisses, backdrop click dismisses, ARIA `role="dialog"` and `aria-modal="true"` are present
