# templates-dashboard-page

## Purpose
This capability defines the merchant-facing "Templates" page in the dashboard — a dedicated page that consolidates the template picker (previously in Settings > Storefront Layout) and a section-by-section homepage editor with visibility toggles and content forms.

## Requirements

### Requirement: Templates Dashboard Page
The dashboard MUST have a "Templates" page accessible at the route `dashboard/templates`. The page MUST be linked from the dashboard sidebar navigation with a layout/palette icon. The page MUST display two main areas: (1) a template picker card at the top, and (2) a homepage sections editor below.

#### Scenario: Navigating to Templates page
- **WHEN** a merchant clicks the "Templates" link in the dashboard sidebar
- **THEN** the Templates page loads showing the template picker and the homepage sections editor.

### Requirement: Template Picker on Templates Page
The Templates page MUST display the template picker showing all available active templates as visual cards with preview thumbnails, names, and descriptions. The merchant's currently active template MUST be visually indicated (e.g., checkmark, highlighted border). Available templates matching the merchant's subscription tier MUST show a selectable state. Tier-locked templates MUST show a lock icon and upgrade prompt. An "Apply Template" button MUST trigger a confirmation dialog before switching templates. This replaces the template picker previously in Settings > Storefront Layout.

#### Scenario: Merchant applies a different template
- **WHEN** a merchant selects the "fashion" template card and clicks "Apply Template", then confirms the dialog
- **THEN** the merchant's template is updated to "fashion" and the sections editor below refreshes to show the current section content.

#### Scenario: Tier-locked template display
- **WHEN** a starter-plan merchant views the Templates page and the fashion template requires growth tier
- **THEN** the fashion template card shows a lock icon and "Upgrade to unlock" text, and cannot be selected.

### Requirement: Homepage Sections Editor
The Templates page MUST display an accordion-based sections editor below the template picker. Each of the universal sections (hero, announcement_bar, category_showcase, about, faq, footer) MUST appear as a collapsible panel. Each panel header MUST show: the section's display name (e.g., "Hero Banner", "Announcement Bar", "Category Showcase", "About Your Brand", "FAQ", "Footer"), and a visibility toggle switch on the right side. Panels MUST be collapsed by default. Expanding a panel reveals the content editing form fields for that section. The Footer section MUST always be displayed as the last section in the list and MUST NOT be sortable by the user.

#### Scenario: Expanding a section panel
- **WHEN** a merchant clicks on the "Hero Banner" panel header
- **THEN** the panel expands to reveal form fields for editing the hero section content (image upload, heading, subheading, CTA text, overlay opacity).

#### Scenario: Collapsing a section panel
- **WHEN** a merchant clicks on an expanded panel header
- **THEN** the panel collapses, hiding the form fields while preserving any unsaved edits in form state.

### Requirement: Section Visibility Toggle
Each section panel MUST have a toggle switch in its header that controls the section's `is_visible` state. When toggled off, the panel MUST visually grey out and collapse, indicating the section will not appear on the storefront. Toggling off MUST NOT delete the section's content — the merchant can toggle it back on and their content is preserved. The toggle state is persisted when the merchant saves.

#### Scenario: Toggling a section to hidden
- **WHEN** a merchant toggles the "About Your Brand" section switch to off
- **THEN** the panel collapses and greys out, and after saving, the about section no longer renders on the storefront homepage.

#### Scenario: Re-enabling a hidden section
- **WHEN** a merchant toggles a previously hidden section back to visible
- **THEN** the panel becomes active again with all previous content intact, and after saving, the section reappears on the storefront.

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

### Requirement: Batch Save All Sections
The Templates page MUST have a single "Save All Sections" button at the bottom of the sections editor. Clicking save MUST submit all section content and visibility states in a single batch server action. The save MUST validate all section content against Zod schemas before persisting. On success, a toast notification confirms the save. On validation failure, the specific section and field with the error MUST be highlighted.

#### Scenario: Successful batch save
- **WHEN** a merchant edits multiple sections and clicks "Save All Sections"
- **THEN** all section updates are validated and persisted in a single transaction, and a success toast appears.

#### Scenario: Validation error on save
- **WHEN** a merchant has an invalid field (e.g., category showcase with 5 tiles) and clicks save
- **THEN** the save is rejected, the Category Showcase panel auto-expands, the offending field is highlighted with an error message, and no changes are persisted.

### Requirement: Template Picker Removed from Settings Storefront Tab
The template picker and ALL presentation-related fields (`heroImageUrl`, `subtitle`, `storeDescription`, `storeAddress`, `socialLinks`, `customFaqs`) MUST be completely removed from the Settings page. The "Storefront Layout" tab MUST be removed entirely, as all storefront presentation data is now exclusively managed via the Templates dashboard.

#### Scenario: Settings page navigation after migration
- **WHEN** a merchant navigates to the Settings page in the dashboard
- **THEN** the "Storefront Layout" tab does not exist, and all presentation settings are located in the Templates page instead.

### Requirement: Dashboard Sidebar Navigation Update
The dashboard sidebar MUST include a "Templates" navigation link with a layout or palette icon. The link MUST navigate to `dashboard/templates`. The link MUST appear in the sidebar alongside existing links (Dashboard, Products, Orders, Settings, etc.).

#### Scenario: Templates link in sidebar
- **WHEN** a merchant views the dashboard sidebar on any page
- **THEN** a "Templates" link with an appropriate icon is visible and navigates to the Templates page when clicked.

### Requirement: Unsortable Footer Section
The Footer section panel in the Templates dashboard MUST NOT be sortable via drag-and-drop. It MUST remain pinned as the last section in the list of sections.

#### Scenario: Merchant attempts to sort Footer section
- **WHEN** a merchant attempts to drag the Footer section panel
- **THEN** the drag action is prevented and the Footer remains at the bottom of the sections list.

### Requirement: Live Preview Pane
The Templates page MUST replace the wireframe canvas with a `PreviewPane` component containing an iframe that loads the merchant's storefront preview route. The iframe MUST be embedded in a container with a fake browser chrome (traffic light dots, URL bar showing the merchant's subdomain). The preview pane MUST send `preview-update` postMessage events to the iframe whenever the editor's sections or theme state changes, debounced at 300ms.

#### Scenario: Preview loads the merchant's storefront
- **WHEN** the Templates page loads for a merchant with subdomain "mystore"
- **THEN** the preview pane renders an iframe pointing to `{protocol}//mystore.{host}/preview`

#### Scenario: Editing hero title updates preview in real-time
- **WHEN** a merchant types a new hero title in the sections editor
- **THEN** the preview iframe re-renders the hero section with the new title within 300ms

### Requirement: Viewport Toggles
The preview pane toolbar MUST include three viewport toggle buttons: mobile (375px), tablet (768px), and desktop (full width). Clicking a toggle MUST resize the iframe container width with a smooth transition. The active viewport MUST be visually indicated. Desktop MUST be the default viewport.

#### Scenario: Switching to mobile viewport
- **WHEN** a merchant clicks the mobile (smartphone) viewport toggle
- **THEN** the iframe container shrinks to 375px width, centered within the preview pane, and the mobile toggle appears active

#### Scenario: Switching back to desktop
- **WHEN** a merchant clicks the desktop (monitor) viewport toggle from mobile or tablet view
- **THEN** the iframe expands to full width and the desktop toggle appears active

### Requirement: Section Scroll-Sync
When a merchant expands a section's accordion in the editor, the preview iframe MUST scroll to that section and visually highlight it. The `PreviewPane` MUST send a `focus-section` postMessage with the expanded section's `sectionKey`.

#### Scenario: Expanding hero editor scrolls preview to hero
- **WHEN** a merchant expands the "Hero" section accordion in the editor
- **THEN** the preview iframe scrolls the hero section into view with smooth scrolling

### Requirement: Visit Storefront Button
The Templates page MUST display a "Visit Store" button in the page header that opens the merchant's live storefront in a new browser tab. The URL MUST be `{protocol}//{subdomain}.{host}`. A secondary visit button MUST also appear in the preview pane toolbar.

#### Scenario: Merchant clicks Visit Store
- **WHEN** a merchant clicks the "Visit Store" button
- **THEN** a new browser tab opens with the merchant's storefront URL

### Requirement: Unified Save/Discard Bar
The Templates page MUST display a sticky bottom bar when any unsaved changes exist (sections or theme). The bar MUST show a "You have unsaved changes" message, a "Discard" button that resets all changes to the last saved state, and a "Save All" button that saves both sections and theme settings in parallel. The bar MUST NOT be visible when there are no unsaved changes. The two separate save buttons in the theme and sections accordion headers MUST be removed.

#### Scenario: Unsaved changes bar appears
- **WHEN** a merchant edits any section content or theme setting
- **THEN** a sticky bar slides up from the bottom showing "You have unsaved changes" with Discard and Save All buttons

#### Scenario: Save All persists both sections and theme
- **WHEN** a merchant clicks "Save All" on the unsaved changes bar
- **THEN** both `saveStorefrontSectionsAction` and `updateThemeSettingsAction` are called, and on success a toast confirms the save and the bar disappears

#### Scenario: Discard resets all changes
- **WHEN** a merchant clicks "Discard"
- **THEN** sections and theme settings revert to their last saved values and the unsaved changes bar disappears

#### Scenario: No changes means no bar
- **WHEN** a merchant has not made any edits, or has just saved
- **THEN** the sticky bar is not visible

### Requirement: Merchant Subdomain Passed to Client
The server component MUST pass `merchant.subdomain` as a prop to `TemplatesPageClient` so it can construct the preview iframe URL and visit storefront link.

#### Scenario: Subdomain available in client
- **WHEN** the Templates page loads for a merchant with subdomain "fashionbd"
- **THEN** the preview iframe URL uses "fashionbd" as the subdomain and the Visit Store button links to "fashionbd.{host}"
