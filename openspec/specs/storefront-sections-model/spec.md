# storefront-sections-model

## Purpose
This capability defines the universal section-based content model for storefront homepages. It provides the database table, typed content schemas, CRUD queries, Zod validation, default content seeding, and server actions that enable merchants to manage homepage sections independently of which template they use.

## Requirements

### Requirement: storefront_sections Database Table
The system MUST maintain a `storefront_sections` table with columns: `id` (UUID PK, auto-generated), `merchant_id` (text FK → merchants, NOT NULL, CASCADE on delete), `section_key` (text NOT NULL — one of "hero", "announcement_bar", "category_showcase", "about"), `content` (JSONB NOT NULL), `sort_order` (integer NOT NULL DEFAULT 0), `is_visible` (boolean NOT NULL DEFAULT true), `created_at` (timestamptz DEFAULT now()), `updated_at` (timestamptz DEFAULT now()). A UNIQUE constraint on `(merchant_id, section_key)` MUST ensure each merchant has at most one row per section key. The table MUST have RLS enabled and an index on `merchant_id`.

#### Scenario: Creating a section for a merchant
- **WHEN** a section row is inserted for a merchant with section_key "hero"
- **THEN** the row is created with the provided JSONB content, sort_order, and is_visible flag, and the unique constraint prevents inserting a second "hero" row for the same merchant.

#### Scenario: Querying visible sections for a storefront
- **WHEN** the system queries storefront_sections for a merchant's storefront homepage
- **THEN** the query returns all rows WHERE merchant_id matches AND is_visible = true, ordered by sort_order ascending.

#### Scenario: Deleting a merchant cascades to sections
- **WHEN** a merchant record is deleted from the merchants table
- **THEN** all corresponding storefront_sections rows are automatically deleted via the CASCADE foreign key.

### Requirement: Typed Section Content Schemas
The system MUST define TypeScript types and Zod validation schemas for each section_key's JSONB content shape. The four content types are: (1) `HeroContent` with fields imageUrl (string), heading (string), subheading (string | null), ctaText (string), ctaLink (string), overlayOpacity (number 0–1). (2) `AnnouncementBarContent` with fields messages (array of {text: string, link?: string}, max 5), speed ("slow" | "normal" | "fast"). (3) `CategoryShowcaseContent` with fields heading (string), eyebrow (string), tiles (array of {imageUrl: string, label: string, linkUrl: string, categoryId?: string}, 2–4 items). (4) `AboutContent` with fields eyebrow (string), heading (string), body (string, max 500 chars), imageUrl (string), imagePosition ("left" | "right"), ctaText (string, optional), ctaLink (string, optional).

#### Scenario: Validating hero section content
- **WHEN** a merchant submits hero section content with overlayOpacity set to 1.5
- **THEN** the Zod schema rejects the value because overlayOpacity must be between 0 and 1, and returns a validation error message.

#### Scenario: Validating category showcase tiles count
- **WHEN** a merchant submits category showcase content with 5 tiles
- **THEN** the Zod schema rejects the submission because tiles must have between 2 and 4 items.

### Requirement: Section Pre-Seeding with Default Content
When a merchant's homepage sections are first initialized (on first visit to the Templates page or on store creation), the system MUST insert all 4 section rows with sensible default content and placeholder image URLs. Default content MUST use the merchant's store name for the hero heading, generic placeholder text for other fields, and placeholder images from the `template-defaults/` path in Supabase storage. All sections MUST default to `is_visible: true`. The seeding operation MUST be idempotent — if sections already exist for the merchant, no duplicates are created.

#### Scenario: First-time section seeding
- **WHEN** a merchant visits the Templates page and has no existing storefront_sections rows
- **THEN** the system inserts 4 rows (hero, announcement_bar, category_showcase, about) with default content including the merchant's store name in the hero heading, and all sections set to is_visible = true.

#### Scenario: Idempotent seeding
- **WHEN** section seeding runs for a merchant who already has all 4 sections
- **THEN** no new rows are inserted and existing content is not overwritten.

### Requirement: Section CRUD Server Actions
The system MUST provide server actions for: (1) fetching all sections for the authenticated merchant (with merchant_id from auth session), (2) updating section content and visibility in batch (receiving an array of section updates and persisting them in a single transaction), (3) toggling a single section's visibility. All server actions MUST enforce merchant_id from `auth.api.getSession()`, never from client input.

#### Scenario: Batch-saving section updates
- **WHEN** a merchant saves all sections from the Templates page editor
- **THEN** the server action receives an array of {section_key, content, is_visible} updates, validates each against the appropriate Zod schema, and upserts all rows in a single database transaction.

#### Scenario: Unauthorized section access
- **WHEN** a request to update sections is made without a valid authenticated session
- **THEN** the server action returns an authentication error and no database changes occur.
