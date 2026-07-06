## Context

The storefront `ProductCard` component currently renders an "Add to Cart" button that immediately dispatches a cart action with only the base `productId` — no variant selection. Since every ShopNest product supports variants (color, size), this creates corrupt cart items with missing `variantId` and potentially wrong `unit_price`. The bug has been deferred because the PDP already handles variant selection correctly; this change extends that proven UX pattern to the card context.

The existing `pdp-variant-and-actions` spec defines color swatch and size pill interaction models. Those patterns are reused verbatim here — no new interaction language is introduced.

## Goals / Non-Goals

**Goals:**
- Replace the direct Add to Cart action on `ProductCard` with a dialog trigger that surfaces variant selection before cart dispatch.
- Ship a `VariantQuickSelectDialog` client component that is visually premium, fully responsive (bottom-sheet on mobile / centered modal on desktop), and token-driven so it re-skins automatically with any active store theme.
- Register all dialog-specific CSS custom properties in `global.css` under the existing theme variable cascade, ensuring no hard-coded colors leak into the component.
- Reuse the PDP's variant picker sub-components (color swatches, size pills, quantity stepper) without duplication.
- Zero new API endpoints or DB schema changes — the existing `addToCart` server action accepts `{ variantId, quantity }` unchanged.

**Non-Goals:**
- Redesigning the `ProductCard` layout itself (image, title, price, rating area are untouched).
- Implementing variant stock availability filtering UI (future change).
- Building a new animation library — CSS transitions only.
- Adding "Buy Now" / express checkout inside the dialog (PDP-only feature).

## Decisions

### Decision 1 — Custom dialog component (no Radix / shadcn)
Build `VariantQuickSelectDialog` as a fully custom `"use client"` component with a portal (`ReactDOM.createPortal`) to `document.body`, a CSS-driven overlay, and manual focus-trap + keyboard handling (Escape key, focus lock loop).  
**Why**: The project does not use Radix UI or shadcn. A bespoke component keeps the dependency surface minimal, stays consistent with every other custom primitive in `components/storefront/`, and lets us control exactly which CSS classes (and therefore which theme tokens) are applied.  
**Implementation**: The dialog renders two elements inside the portal — an overlay `<div>` and the panel `<div>`. `useEffect` adds/removes `overflow: hidden` on `<body>` while open. A `ref` + `onKeyDown` on the panel handles Escape and tab-cycle focus trapping. ARIA attributes (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) are set directly as props.  
**Alternative considered**: Radix `@radix-ui/react-dialog` — rejected; not in the project and adding it would be the only third-party headless UI dependency, inconsistent with the custom-component approach used everywhere else.

### Decision 2 — Bottom-sheet on mobile, centered modal on desktop
The dialog uses a CSS-only responsive layout: `position: fixed; bottom: 0` with `border-radius: var(--dialog-radius-mobile) var(--dialog-radius-mobile) 0 0` on mobile (`max-width: 640px`), switching to `top: 50%; transform: translateY(-50%)` centered card on desktop.  
**Why**: Bottom-sheet is the dominant mobile e-commerce pattern (Tokopedia, Shopee, Daraz). It respects thumb reachability. The CSS approach avoids a JS breakpoint listener and compiles away under React Compiler.  
**Alternative considered**: Always centered modal — rejected; cramped on small phones, especially with a keyboard open.

### Decision 3 — Theme tokens live in `globals.css` inside each theme class block
All dialog surface values are declared as CSS custom properties **inside** the existing theme class blocks in `app/globals.css` (`.storefront-theme-default { }`, `.storefront-theme-cinematic { }`, and any future theme). The dialog component references them via `var(--dialog-*)` with no hard-coded fallbacks.  
**Why**: ShopNest's storefront theming system works by toggling a theme class on the storefront shell element (e.g. `<div class="storefront-theme-default">`). Custom properties declared inside that class are inherited by all descendants — including dialog portals that are appended to `document.body`, provided the portal wrapper also carries or inherits the theme class. The dialog portal wrapper must receive the active theme class name as a prop and apply it to the portal root `<div>`.  
**Token additions required in each theme block**:
```css
/* Inside .storefront-theme-default { } and .storefront-theme-cinematic { } */
--dialog-bg: var(--color-canvas-light);
--dialog-overlay: rgba(0, 0, 0, 0.5);
--dialog-radius: var(--radius-lg);           /* inherits per-theme radius */
--dialog-radius-mobile: var(--radius-lg);
--dialog-border: 1px solid var(--color-hairline-light);
--dialog-product-thumb-bg: var(--color-surface-product);
--dialog-z-index: 50;
```
The portal root `<div>` rendered by `VariantQuickSelectDialog` accepts a `themeClass` prop (e.g. `"storefront-theme-default"`) and applies it so all `--dialog-*` variables resolve correctly even though the element is outside the main React tree.

### Decision 4 — Variant picker sub-components extracted for reuse
Color swatches and size pills are extracted into `components/storefront/ui/variant-color-swatch.tsx` and `components/storefront/ui/variant-size-pill.tsx` if they are not already shared. The PDP and the dialog both import from these shared leaves.  
**Why**: DRY; spec-driven reuse avoids diverging interaction models between PDP and quick-select dialog.

### Decision 5 — No `"use cache"` on the dialog; it is a pure client component
The dialog receives product data (name, image, variants) via props from its parent RSC (`ProductCard` server wrapper). The dialog itself is `"use client"` and stateful (selected variant, quantity). The parent RSC owns caching.  
**Why**: Consistent with the project's "use cache at data-fetching layer, not at interactive leaf" rule.

### Decision 6 — Quantity stepper resets on dialog open
Every time the dialog is opened for a product, quantity resets to 1 and variant selection resets to the default (first available variant).  
**Why**: Users opening the dialog for different products should not see stale selection from a previous product. The cost of always resetting is lower than the confusion cost of stale state.

## Risks / Trade-offs

- **[Risk] ProductCard data shape may not carry full variant list** → Mitigation: Audit the existing `ProductCard` props type before implementation. If the card only receives a `productId` today, the parent PLP query must be expanded to also fetch variants. Document this as a required data-layer prerequisite in tasks.

- **[Risk] Custom dialog z-index conflicts with site header or toast stack** → Mitigation: `--dialog-z-index: 50` is declared in each theme block; verify it sits above the header stacking context and below any toast notification layer. The overlay and panel both reference this token.

- **[Risk] Bottom-sheet animation jank on low-end Android devices** → Mitigation: Use `will-change: transform` only during the transition, remove it after. Avoid `height` animation — use `transform: translateY` instead.

- **[Risk] Closing the dialog mid-interaction loses selected state** → Acceptable trade-off (Decision 6). No persistence to session storage for this scope.

## Migration Plan

1. Add `--dialog-*` token additions inside `.storefront-theme-default { }` and `.storefront-theme-cinematic { }` blocks in `app/globals.css` — zero visual regression risk to existing components.
2. Create shared variant sub-components if not already extracted.
3. Create `VariantQuickSelectDialog` component with full test coverage.
4. Update `ProductCard` to accept `variants` prop and wire the dialog trigger — replace the direct cart action call.
5. Update all parent PLP/carousel queries to include variant data in the product fetch.
6. Regression test all existing PDP flows (no change expected but verify).
7. Deploy — no feature flag needed; the card's Add to Cart button changes atomically.

**Rollback**: Revert the `ProductCard` change to restore direct cart action. Dialog component can remain dormant.

## Open Questions

- Does the existing `ProductCard` type include `variants`? If not, which query/RSC owns the PLP product fetch and needs updating? (Must be answered before Task 3.)
- Are color swatches already extracted as a shared component from the PDP work, or do they need to be created fresh? (Check `components/storefront/ui/` before Task 2.)
