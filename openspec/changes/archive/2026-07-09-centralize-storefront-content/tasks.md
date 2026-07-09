## 1. Schema and Type Updates

- [x] 1.1 Add `FaqContent` and `FooterContent` Zod schemas and TypeScript types for `storefront_sections` content. Include `storeDescription`, `storeAddress`, and `socialLinks` in `FooterContent`.
- [x] 1.2 Update the `StorefrontSection` types to include `"faq"` and `"footer"` in `section_key` variants.
- [x] 1.3 Write failing unit tests for FAQ and Footer Zod validation to ensure required fields and constraints work, then ensure tests pass.
- [x] 1.4 Write Drizzle migration to drop `hero_image_url`, `subtitle`, `store_description`, `store_address`, `social_links`, and `custom_faqs` columns from the `merchants` table. (Do not run the migration until step 6 is complete).

## 2. Default Seeding and Data Layer

- [x] 2.1 Update the section pre-seeding logic to insert 6 rows (including `faq` and `footer`) instead of 4 for new stores.
- [x] 2.2 Add logic to the seeding function to set a massive `sort_order` for the `footer` section so it always appears last.
- [x] 2.3 Write tests for the seeding server action to verify 6 sections are created correctly.

## 3. Settings UI Modifications

- [x] 3.1 Completely remove the `Storefront Layout` tab and `StoreSettingsForm` component, as it is no longer needed.
- [x] 3.2 Update Settings page navigation to remove references to the Storefront Layout tab.
- [x] 3.3 Clean up any unused state or Zod validations related to the dropped fields in the `stores` settings schema.

## 4. Templates Dashboard Editor

- [x] 4.1 Introduce UI panels for managing the content of the new `faq` and `footer` sections inside `/dashboard/templates`. Ensure the schema enforces rules (e.g. up to 8 items).
- [x] 4.2 Update the active template sorting view (e.g., SectionManager or drag/drop lists) to display the new sections.
- [x] 4.3 Ensure the footer section appears strictly at the bottom of the section list and cannot be reordered by the user.
- [x] 4.4 Make sure the templates dashboard correctly uses `storefront_sections` actions to save data instead of the legacy `updateStorefrontLayoutAction`.

## 5. Storefront Rendering

- [x] 5.1 Modify `getStorefrontSections` to fetch the new `faq` and `footer` sections.
- [x] 5.2 Refactor `GeneralHeroBanner` and `FashionEditorialHero` to remove fallback logic to `store.heroImageUrl` and `store.subtitle`. They should only use the `hero` section content.
- [x] 5.3 Refactor `GeneralFooter` and `FashionFooter` to read `description`, `address`, and `socialLinks` from the `footer` section instead of the global `store` object.
- [x] 5.4 Update `layout.tsx` to stop packing the dropped fields into the `store` prop.
- [x] 5.5 Write integration tests for `getStorefrontSections` to verify `footer` is returned last.

## 6. Data Migration

- [x] 6.1 Create a data migration script (or update the seeding logic temporarily) that reads the legacy presentation fields from `merchants` and inserts them as `hero` (fallback values), `faq`, and `footer` rows into `storefront_sections` for all existing merchants.
- [x] 6.2 Execute the data migration on the database.
- [x] 6.3 Run the Drizzle migration created in Step 1.4 to drop the legacy columns from the `merchants` table.

