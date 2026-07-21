# Feature Specification: json-template-engine

**Feature Branch**: `[006-json-template-engine]`

**Created**: 2026-07-21

**Status**: Draft

**Input**: User description: "Remove all existing code regarding templates, /dashboard/templates, and storefront. Drop the store_templates and storefront_sections database tables. Start over to build a JSON-driven block architecture (like Shopify OS 2.0). Build a universal section library where blocks (e.g. Hero, Featured Products) are available across all themes, and themes just provide base CSS/styling. A visual drag-and-drop editor with a live preview iframe in the merchant dashboard."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Theme Selection and Customization (Priority: P1)

Merchants need a way to select a base theme and visually customize their storefront using a drag-and-drop interface, so they can design a unique shopping experience.

**Why this priority**: Without this, the merchant cannot build their storefront or apply layouts. It's the core interaction point for the feature.

**Independent Test**: Can be fully tested by opening the merchant dashboard, dragging sections into the layout, and verifying the preview updates instantly.

**Acceptance Scenarios**:

1. **Given** a merchant in the dashboard, **When** they navigate to the Editor, **Then** they see a live preview iframe and a drag-and-drop sidebar.
2. **Given** the visual editor, **When** the merchant reorders a section, **Then** the live preview updates immediately via postMessage.
3. **Given** the visual editor, **When** the merchant clicks "Save", **Then** the JSON layout is persisted to the database.

---

### User Story 2 - Storefront Rendering (Priority: P1)

Shoppers need to see the dynamic storefront exactly as the merchant designed it in the editor.

**Why this priority**: The editor is useless if the public storefront cannot correctly parse and render the JSON layout.

**Independent Test**: Can be fully tested by navigating to the merchant's subdomain and verifying the layout matches the JSON definition exactly.

**Acceptance Scenarios**:

1. **Given** a saved JSON layout in the database, **When** a shopper visits the subdomain, **Then** the Render Engine dynamically maps the JSON blocks to the universal section components.
2. **Given** a selected theme (e.g. Elegance), **When** the storefront renders, **Then** the base CSS variables (colors, fonts, radius) for that theme are injected globally.

### Edge Cases

- What happens when a section type in the JSON is missing or deprecated in the codebase? (Should safely render a placeholder or skip).
- How does system handle malformed JSON layouts in the database? (Should fallback to a default layout).
- How does the system handle concurrent edits in the dashboard?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow merchants to add, remove, and reorder universal sections on their storefront.
- **FR-002**: System MUST render a live preview iframe in the dashboard that updates instantaneously when sections are modified.
- **FR-003**: System MUST store the active layout and theme selections in the database as a single JSON structure.
- **FR-004**: System MUST inject global CSS variables based on the selected base theme.
- **FR-005**: System MUST delete the old `store_templates` and `storefront_sections` tables and clear out old code files.
- **FR-006**: System MUST parse the JSON layout on the public storefront and dynamically render the corresponding React components.

### Assumptions *(optional)*

- **A-001**: We assume the initial Universal Section Library will consist of standard eCommerce sections (Hero, Featured Products, Banner, Footer, Announcement).
- **A-002**: The editor will use standard HTML5 Drag and Drop or a lightweight library for section reordering.

## Success Criteria *(mandatory)*

- Merchants can build a complete storefront page layout in under 5 minutes using the visual editor.
- The drag-and-drop editor correctly syncs with the live preview.
- All legacy constraints (like "no drag-and-drop" and "fixed 10 sections") are successfully removed from the architecture.
- Storefront page load performance remains under 1.5 seconds despite dynamic JSON parsing.

## System Interfaces *(optional)*

- **Data Models**:
  - `themes` table: ID, name, base CSS variables.
  - `merchant_themes` table: Merchant ID, Theme ID, `active_layout` JSON field.
