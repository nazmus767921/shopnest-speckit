## Context

The ShopNest platform recently introduced a `storefront_sections` database table and a Templates dashboard (`/dashboard/templates`) to allow merchants to manage homepage layouts. However, a legacy set of presentation fields (`heroImageUrl`, `subtitle`, `storeDescription`, `storeAddress`, `socialLinks`, `customFaqs`) remained on the `merchants` table and in the Store Settings page as a fallback for older templates. This split data model requires complex fallback logic in the template rendering components (e.g., trying to read from a section, then falling back to the `merchants` table). It also forces the merchant to configure their storefront in two different places.

## Goals / Non-Goals

**Goals:**
- Completely eliminate the Storefront Layout tab from the Store Settings dashboard.
- Migrate all legacy presentation fields from `merchants` into the `storefront_sections` table.
- Drop the redundant columns from the `merchants` table.
- Enforce that the Footer section is always rendered last and cannot be reordered by the merchant.

**Non-Goals:**
- Overhauling the visual design of the components (Hero, FAQ, Footer) beyond rewiring their data source.

## Decisions

**1. Consolidate All Presentation into `storefront_sections`**
- **Decision:** We will migrate all presentation fields from `merchants` into `storefront_sections`. Specifically, `heroImageUrl` and `subtitle` will map to the `hero` section's `imageUrl` and `subheading`. `storeDescription`, `storeAddress`, and `socialLinks` will map to a new `footer` section. `customFaqs` will map to a new `faq` section.
- **Rationale:** Standardizes data fetching. The homepage will just query `storefront_sections`, parse the JSONB content via Zod, and render sections in order without any fallback logic.

**2. Database Migration Strategy**
- **Decision:** We will write a Drizzle migration that drops the 6 columns from `merchants` (`hero_image_url`, `subtitle`, `store_description`, `store_address`, `social_links`, `custom_faqs`). We will also write a one-time data migration script to ensure existing stores have these values copied into `storefront_sections` *before* dropping the columns, or we handle it in a coordinated deploy sequence. 
- **Rationale:** We must not lose merchant data. If a merchant customized their footer, it must survive the column drop by being safely inside `storefront_sections`.

**3. Enforcing Unsortable Footer**
- **Decision:** The UI's drag-and-drop sorting will explicitly exclude the `footer` section from its sortable context. On the backend, we will seed the `footer` with an extremely high `sort_order` and enforce it stays at the end.
- **Rationale:** The footer MUST be the last element to avoid breaking web layouts. Preventing it from participating in the sorting logic entirely is the safest approach.

## Risks / Trade-offs

- **Risk: Data Loss During Migration**
  - **Mitigation:** The data migration must run successfully before the `merchants` columns are dropped. We will create a robust script that reads the legacy fields and performs an `INSERT ... ON CONFLICT DO NOTHING` into `storefront_sections` to safely migrate the data.
- **Risk: Next.js Layout Metadata (SEO)**
  - **Mitigation:** We have confirmed that `storeDescription` is currently *not* used for `<meta name="description">` in `layout.tsx` (it currently uses a hardcoded fallback string). So dropping `storeDescription` will not break existing SEO.
