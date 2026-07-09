# template-management

## Purpose
This capability defines the superadmin template management interface and the merchant-facing template gallery for previewing and switching templates in the dashboard settings.

## Requirements

### Requirement: SuperAdmin Template List
The superadmin dashboard MUST display a "Template Management" page listing all `store_templates` records. Each template entry SHALL show: name, slug, preview thumbnail, active/draft status badge, allowed subscription tiers, mapped business types, and action buttons (edit, toggle active/draft).

#### Scenario: SuperAdmin views template list
- **WHEN** the superadmin navigates to the template management page
- **THEN** the page displays all templates (both active and draft) with their metadata, sorted by `sort_order`.

### Requirement: SuperAdmin Template Tier Assignment
The superadmin MUST be able to edit which subscription tiers can access each template. The edit form SHALL present checkboxes for each tier (e.g., starter, growth, pro). Saving the form SHALL update the `allowed_tiers` JSONB column.

#### Scenario: SuperAdmin restricts template to growth tier
- **WHEN** the superadmin edits the "fashion" template and unchecks "starter" from allowed tiers, then saves
- **THEN** the `store_templates` record for "fashion" updates its `allowed_tiers` to exclude "starter", and merchants on the starter plan can no longer select the fashion template.

### Requirement: SuperAdmin Template Active/Draft Toggle
The superadmin MUST be able to toggle a template between active and draft states. Draft templates MUST NOT appear in merchant template galleries. Active templates MUST appear to merchants whose subscription tier is in `allowed_tiers`.

#### Scenario: SuperAdmin sets template to draft
- **WHEN** the superadmin toggles the "fashion" template to draft status
- **THEN** the fashion template no longer appears in any merchant's template gallery, and merchants currently using it continue to render with it until they switch.

### Requirement: Merchant Template Gallery
The merchant dashboard settings page MUST display a visual template gallery showing all active templates. Each template card SHALL show a preview thumbnail, template name, and brief description. Available templates (matching the merchant's subscription tier) SHALL show "Preview" and "Apply" buttons. Unavailable templates (tier-locked) SHALL show a lock icon and "Upgrade to unlock" prompt.

#### Scenario: Starter-plan merchant views template gallery
- **WHEN** a merchant on the starter plan opens the template gallery in their settings
- **THEN** templates with "starter" in their `allowed_tiers` show "Preview" and "Apply" buttons, and templates without "starter" show as locked with an upgrade prompt.

### Requirement: Merchant Template Preview
The template gallery MUST allow merchants to preview any available template using their real store data. Clicking "Preview" SHALL open the storefront in a new tab with `?template_preview=<slug>` appended to the URL. The preview SHALL render the store using the selected template without persisting the change.

#### Scenario: Merchant previews fashion template
- **WHEN** a merchant clicks "Preview" on the fashion template card in their settings
- **THEN** a new browser tab opens showing their storefront rendered with the fashion template layout, using their actual products and store data.

### Requirement: Merchant Template Apply
Clicking "Apply" on a template card MUST update the merchant's `template` column in the database. The system SHALL verify that the merchant's subscription tier is in the template's `allowed_tiers` before applying. A confirmation dialog MUST appear before the change is committed.

#### Scenario: Merchant applies fashion template
- **WHEN** a growth-plan merchant clicks "Apply" on the fashion template, confirms the dialog
- **THEN** the merchant's `template` value is updated to "fashion" in the database, and subsequent storefront visits render using the fashion template.

#### Scenario: Tier-check rejection on apply
- **WHEN** a request to apply a template is submitted but the merchant's subscription tier is not in the template's `allowed_tiers`
- **THEN** the server action rejects the update and returns an error message indicating the template requires a higher subscription tier.

### Requirement: store_templates Database Table
The system MUST maintain a `store_templates` table with columns: `id` (text PK), `slug` (text unique), `name` (text), `description` (text), `preview_image_url` (text), `business_types` (JSONB array), `allowed_tiers` (JSONB array), `is_active` (boolean), `is_default` (boolean), `sort_order` (integer), `created_at` (timestamptz), `updated_at` (timestamptz). Exactly one template MUST have `is_default = true` at all times.

#### Scenario: Querying available templates for a merchant tier
- **WHEN** the system queries templates for a merchant on the "growth" plan
- **THEN** the query returns all templates WHERE `is_active = true` AND `'growth'` is contained in the `allowed_tiers` JSONB array, ordered by `sort_order`.
