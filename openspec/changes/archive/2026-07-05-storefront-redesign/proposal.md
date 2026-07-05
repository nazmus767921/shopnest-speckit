## Why

The current storefront template relies on the root ShopNest styling variables and layout aesthetics, which deviates from the mobile-first, high-contrast, bold design requirements specified in the SHOP.CO Design System and PRD. Scoping the theme overrides will resolve this discrepancy. Additionally, support for multiple themes (default high-contrast and cinematic) with subscription-plan-based activation from the merchant dashboard will allow tier-based storefront options.

## What Changes

- **Theme Scoping**: Redefine Tailwind v4 CSS variables specifically under `.storefront-theme-default` and `.storefront-theme-cinematic` scopes inside `app/globals.css` to enable multiple themes.
- **Font Loading**: Integrate Google Font `Archivo Black` for storefront headings via Next.js `next/font/google` in `app/(storefront)/[subdomain]/layout.tsx`.
- **Typography & Components**: Establish custom storefront-specific typography utilities and components (primary/secondary/outline buttons, discount tag, product card image frames) inside the theme scopes.
- **Page Layout Redesign**: Re-architect and redesign the Product Detail Page (PDP), Product Listing Page (PLP), and Cart page layouts to adapt to the active theme.
- **Storefront Theme Database Setting**: Add a `theme` field to `merchants` table in the database to store the merchant's chosen storefront theme.
- **Dashboard Settings Selection**: Add a theme chooser UI dropdown/control inside `StoreSettingsForm.tsx` where merchants can select their storefront theme.
- **Plan Enforcement**: Disable premium themes for merchants on basic/starter plans and prompt them to upgrade.

## Capabilities

### New Capabilities
- `storefront-theme-redesign`: Implements the scoped theme configurations, custom typography utilities, and redesigned components/pages (PDP, PLP, Cart).
- `storefront-theme-selection`: Implements the database column, settings form picker, and server-side subscription validation to manage and restrict theme selection.

### Modified Capabilities
<!-- Leave empty as we don't modify existing specs/ requirements -->

## Impact

- **Affected Areas**: `db/schema.ts`, `app/globals.css`, `app/(storefront)/[subdomain]/layout.tsx`, `components/storefront/*`, `app/(dashboard)/dashboard/settings/components/StoreSettingsForm.tsx`, and page route files under `app/(storefront)/[subdomain]/`.
- **No Side-Effects**: Dashboard settings and marketing paths are kept separate from storefront CSS scopes to prevent visual style contamination.

