## 1. Testing Setup (TDD)

- [x] 1.1 Create unit/integration tests in `__tests__/VariantSelector.test.tsx` verifying that size selector selection state reversals (reversing colors to active black-pill state) and color selectors (circular swatches) work correctly.
- [x] 1.2 Create integration tests in `__tests__/StorefrontTheme.test.tsx` validating that settings update rejects saving `theme = 'cinematic'` for merchants on the `starter` plan, and successfully saves it for merchants on the `growth` plan.


## 2. Global Scoped Styling Overrides

- [x] 2.1 Define `.storefront-theme-default` and `.storefront-theme-cinematic` class rules in `app/globals.css`, overriding color, background, border-radius, and font variables to match each theme's specifications.
- [x] 2.2 Define storefront-specific typography utility classes (`text-storefront-display-huge`, `text-storefront-display-lg`, `text-storefront-heading-lg`, etc.) nested within the themes in `app/globals.css`.
- [x] 2.3 Define storefront-specific component classes (`btn-storefront-primary`, `btn-storefront-secondary`, `btn-storefront-outline`, `tag-storefront-discount`, etc.) inside the theme scopes.


## 3. Core Storefront Layout & Page Redesigns

- [x] 3.1 Load Google Font `Archivo Black` via Next.js `next/font/google` in `app/(storefront)/[subdomain]/layout.tsx`. Fetch the active theme value (`merchant.theme`) from the database and pass the dynamic class name `storefront-theme-${theme}` to the layout wrapper. Ensure dynamic elements are wrapped inside `<Suspense>` and `await connection()` is utilized for static prerender safety.
- [x] 3.2 Update `StorefrontNavbar.tsx` and layout footer, incorporating the Newsletter Block, custom email input, primary subscribe button, and company social links.

- [x] 3.3 Redesign `ProductCard.tsx` and `ProductSlider.tsx` grids to render cards with the light gray background (`#F0EEED`), rounded-md shape, and centered layout details.
- [x] 3.4 Redesign Product Detail Page (`app/(storefront)/[subdomain]/product/[slug]/page.tsx`), adding breadcrumbs hierarchy, tab navigation styling, product review verified checkmarks, and the upsell product grid.
- [x] 3.5 Redesign Product Listing Page (`app/(storefront)/[subdomain]/products/page.tsx`), adding the mobile filter button, category accordion-style filters (Categories, Price range, Colors grid, Size grid), and standard numbered pagination.
- [x] 3.6 Redesign Cart Page (`app/(storefront)/[subdomain]/cart/page.tsx` & `CartClientPage.tsx`), rendering the split-column layout on desktop, list items quantity adjuster pills, and order summary card details.
- [x] 3.7 Add the `theme` text field to `merchants` table in `db/schema.ts` (defaulting to `'default'`) and generate the Drizzle migration script.
- [x] 3.8 Add a storefront theme selector radio/dropdown in `StoreSettingsForm.tsx`. Read the active merchant's resolved plan features; disable the `"cinematic"` premium option for `starter` plan merchants and render an upgrade callout. Add validation check to update Server Action.

## 4. Verification & Refactoring

- [x] 4.1 Execute full test suite `npm run test` or `vitest run` to ensure all tests are green (including newly added theme verification and variant selectors selection tests).
- [x] 4.2 Verify Next.js compilation via `npm run build` or similar. Resolve any static prerendering errors if cookies/headers are accessed without dynamic safety wrapper structures.
