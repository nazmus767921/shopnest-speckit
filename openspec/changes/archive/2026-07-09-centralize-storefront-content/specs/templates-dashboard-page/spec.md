## MODIFIED Requirements

### Requirement: Homepage Sections Editor
The Templates page MUST display an accordion-based sections editor below the template picker. Each of the universal sections (hero, announcement_bar, category_showcase, about, faq, footer) MUST appear as a collapsible panel. Each panel header MUST show: the section's display name (e.g., "Hero Banner", "Announcement Bar", "Category Showcase", "About Your Brand", "FAQ", "Footer"), and a visibility toggle switch on the right side. Panels MUST be collapsed by default. Expanding a panel reveals the content editing form fields for that section. The Footer section MUST always be displayed as the last section in the list and MUST NOT be sortable by the user.

#### Scenario: Expanding a section panel
- **WHEN** a merchant clicks on the "Hero Banner" panel header
- **THEN** the panel expands to reveal form fields for editing the hero section content (image upload, heading, subheading, CTA text, overlay opacity).

#### Scenario: Collapsing a section panel
- **WHEN** a merchant clicks on an expanded panel header
- **THEN** the panel collapses, hiding the form fields while preserving any unsaved edits in form state.

### Requirement: Section Content Form Fields
Each section panel MUST contain form fields matching the section's typed content schema. Hero section: image upload/preview, heading text input, subheading text input, CTA text input, CTA link input, overlay opacity slider (0–100%). Announcement bar: a dynamic list of message text inputs with optional link URL inputs, add/remove message buttons (max 5), speed radio selector (slow/normal/fast). Category showcase: heading text input, eyebrow text input, a list of tile editors (each with image upload, label input, link URL input), add/remove tile buttons (2–4 tiles). About section: eyebrow text input, heading text input, body textarea (max 500 chars), image upload/preview, image position radio (left/right), optional CTA text and link inputs. FAQ section: dynamic list of Q&A pairs with inputs for question and answer, add/remove buttons. Footer section: fields for configuring footer content (e.g., store description, store address, copyright text, whether to show payment badges, social links).

#### Scenario: Editing hero section content
- **WHEN** a merchant expands the Hero Banner panel, uploads a new image, changes the heading, and adjusts the overlay opacity slider
- **THEN** the form reflects the changes in real-time (image preview updates, heading input shows new value, slider shows new position) and the changes are held in form state until saved.

#### Scenario: Adding a mosaic tile
- **WHEN** a merchant clicks "Add Tile" in the Category Showcase panel (currently has 2 tiles)
- **THEN** a new tile editor appears with empty image, label, and link fields, and the tile count increases to 3.

#### Scenario: Removing a mosaic tile at minimum
- **WHEN** a merchant tries to remove a tile from the Category Showcase panel that currently has 2 tiles
- **THEN** the remove action is disabled or hidden because the minimum tile count is 2.

### Requirement: Template Picker Removed from Settings Storefront Tab
The template picker and ALL presentation-related fields (`heroImageUrl`, `subtitle`, `storeDescription`, `storeAddress`, `socialLinks`, `customFaqs`) MUST be completely removed from the Settings page. The "Storefront Layout" tab MUST be removed entirely, as all storefront presentation data is now exclusively managed via the Templates dashboard.

#### Scenario: Settings page navigation after migration
- **WHEN** a merchant navigates to the Settings page in the dashboard
- **THEN** the "Storefront Layout" tab does not exist, and all presentation settings are located in the Templates page instead.

## ADDED Requirements

### Requirement: Unsortable Footer Section
The Footer section panel in the Templates dashboard MUST NOT be sortable via drag-and-drop. It MUST remain pinned as the last section in the list of sections.

#### Scenario: Merchant attempts to sort Footer section
- **WHEN** a merchant attempts to drag the Footer section panel
- **THEN** the drag action is prevented and the Footer remains at the bottom of the sections list.
