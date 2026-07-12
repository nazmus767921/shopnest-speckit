## ADDED Requirements

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
