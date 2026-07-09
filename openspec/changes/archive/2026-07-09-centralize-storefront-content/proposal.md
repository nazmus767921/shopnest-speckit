## Why

Currently, storefront presentation settings are split between two locations: the `merchants` table (managed in Settings > Storefront Layout) and the new `storefront_sections` table (managed in the Templates dashboard). The `merchants` table retains legacy flat fields for presentation (`heroImageUrl`, `subtitle`, `storeDescription`, `storeAddress`, `socialLinks`, and `customFaqs`). This split architecture creates a disjointed editing experience for merchants and forces storefront layout code to constantly fall back to global settings if a section is missing.

By fully centralizing all storefront presentation data into `storefront_sections`, we can completely eliminate the Storefront Details settings tab, clean up the `merchants` database schema, and ensure a single source of truth for all template rendering. Additionally, enforcing the Footer as an unsortable last section prevents accidental layout breaks.

## What Changes

- Completely remove the Storefront Layout tab from the Settings dashboard.
- Migrate all legacy presentation fields (`heroImageUrl`, `subtitle`, `storeDescription`, `storeAddress`, `socialLinks`, `customFaqs`) from the `merchants` table into the `storefront_sections` table.
- Add `FAQ` and `Footer` panels to the Templates dashboard sections editor.
- Update the `storefront_sections` model to formally support `faq` and `footer` section types.
- Pin the `footer` section to always be the last section in the Templates page and prevent it from being sorted.
- Refactor storefront components (`GeneralHeroBanner`, `GeneralFooter`, `FashionEditorialHero`, `FashionFooter`) to read exclusively from `storefront_sections` instead of the global `store` object.
- **BREAKING**: Drop the `heroImageUrl`, `subtitle`, `storeDescription`, `storeAddress`, `socialLinks`, and `customFaqs` columns from the `merchants` table after migrating data.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `templates-dashboard-page`: Remove the Storefront Layout tab entirely. Update the templates page sections editor to include FAQ and Footer panels. Ensure Footer is pinned at the bottom and unsortable.
- `storefront-sections-model`: Add `faq` and `footer` as section keys. Expand seeding to cover these sections.

## Impact

- `merchants` database table will have 6 columns dropped.
- `StoreSettingsForm` will be removed or significantly reduced (if other non-presentation settings remain, though presentation settings are the only ones left on that tab).
- Templates dashboard (`/dashboard/templates`) becomes the exclusive editor for all homepage presentation.
- Storefront rendering components will no longer use fallback values from the `merchants` table.
