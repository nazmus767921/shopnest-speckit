# Feature Specification: Storefront Template Architecture Migration

**Feature Branch**: `004-storefront-template-migration`

**Created**: 2026-07-15

**Status**: Draft

**Input**: User description: "Based on the grilling session decisions, migrate the existing storefront template system from a loose, builder-like section model to a Squarespace-level opinionated architecture with fixed section order, core/optional classification, hybrid component architecture, and text+images-only content customization."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Merchant Edits Section Content (Priority: P1)

A merchant opens the storefront templates dashboard page. They see a vertical list of all 10 sections in fixed order. Core sections (Hero, Category Showcase, Featured Products, Footer) display a lock icon indicating they are always visible. Optional sections (Announcement Bar, Promo Banner, Brand Story, Testimonials, Newsletter, FAQ) display an on/off toggle. The merchant clicks on the Hero section to expand it, edits the headline text and uploads a new hero image, then clicks save. The live preview updates in real-time to reflect the content changes.

**Why this priority**: This is the fundamental merchant interaction — editing content within the opinionated template system. Every other story depends on this working correctly.

**Independent Test**: Can be fully tested by opening the dashboard templates page, expanding any section editor, changing text/image fields, and verifying the preview updates and data persists after save.

**Acceptance Scenarios**:

1. **Given** a merchant is on the templates dashboard, **When** they view the section list, **Then** all 10 sections appear in fixed order with core sections showing lock icons and optional sections showing toggle switches.
2. **Given** a merchant expands a section editor, **When** they edit text fields and upload images, **Then** the live preview updates in real-time and content persists after save.
3. **Given** a merchant views the section list, **When** they look for drag handles or reorder controls, **Then** none are present — sections cannot be reordered.

---

### User Story 2 - Merchant Toggles Optional Sections (Priority: P1)

A merchant decides they don't have testimonials yet and wants to hide that section. They find the Testimonials section in the dashboard list and toggle it off. The storefront homepage immediately stops rendering the testimonials section. The sections below it move up to fill the space. The section color rhythm re-calculates so no two adjacent sections have clashing background colors. The merchant's testimonial content is preserved — when they toggle it back on later, their previously entered content reappears.

**Why this priority**: Toggling optional sections is the primary flexibility mechanism in the opinionated system. Without this, merchants would be stuck with sections they can't use.

**Independent Test**: Can be fully tested by toggling an optional section off, verifying it disappears from the storefront, checking adjacent section colors remain visually coherent, and toggling it back on to verify content preservation.

**Acceptance Scenarios**:

1. **Given** an optional section is visible, **When** the merchant toggles it off, **Then** the section disappears from the storefront and adjacent sections reflow with no visual gaps.
2. **Given** an optional section is hidden, **When** the merchant toggles it back on, **Then** the section reappears with its previously saved content intact.
3. **Given** multiple optional sections are hidden, **When** the storefront renders, **Then** the color rhythm recalculates so no two adjacent visible sections have the same background theme.
4. **Given** a core section (Hero, Category Showcase, Featured Products, Footer), **When** the merchant views the dashboard, **Then** there is no toggle — only a lock icon indicating it cannot be hidden.

---

### User Story 3 - Storefront Renders with New Template (Priority: P1)

A customer visits a merchant's storefront. The homepage renders using the single default template (renamed from "fashion" to a neutral premium name). Sections display in the template-defined fixed order. The visual design is pixel-perfect — each section uses the template's own section components where layout differs, and shared primitives (product cards, category cards, etc.) for common elements. The page stacks sections vertically with the template's color rhythm providing visual cohesion between sections.

**Why this priority**: The storefront is the customer-facing product. If it doesn't render correctly with the new architecture, nothing else matters.

**Independent Test**: Can be fully tested by visiting a storefront URL and verifying all 10 sections render in correct order with the template's visual style.

**Acceptance Scenarios**:

1. **Given** a customer visits a storefront, **When** the homepage loads, **Then** sections render in the template's fixed order: announcement bar → hero → category showcase → featured products → promo banner → brand story → testimonials → newsletter → FAQ → footer.
2. **Given** a storefront uses the default template, **When** sections render, **Then** per-template section components (Hero, Category Showcase, Featured Products, Promo Banner, Footer) use the template's unique visual design, while shared sections (Brand Story, Newsletter, FAQ) use shared components styled via template-scoped CSS.
3. **Given** some optional sections are hidden, **When** the page renders, **Then** the visible sections stack vertically with no gaps and the color rhythm adapts to the visible sections.

---

### User Story 4 - System Migration from Old Architecture (Priority: P2)

The system is migrated from the current 3-template, 7-section-type, drag-and-drop architecture to the new 1-template, 10-section-type, fixed-order architecture. The `general` and `retail` templates are deleted. The `fashion` template is renamed. The three separate `product_grid_*` section keys are consolidated into one `featured_products` section. The `about` section key is renamed to `brand_story`. Three new section types are added: `promo_banner`, `testimonials`, `newsletter`. The `SectionRenderer` becomes template-aware. The `TemplateModule` interface gains section component declarations.

**Why this priority**: Migration is foundational but can proceed incrementally. The new architecture can coexist briefly with migration tooling.

**Independent Test**: Can be fully tested by verifying the new schema supports all 10 sections, the template registry has only the renamed default template, and the old template directories are removed.

**Acceptance Scenarios**:

1. **Given** the migration runs, **When** the template registry is checked, **Then** only the renamed default template exists — `general` and `retail` are gone.
2. **Given** existing section data has `sectionKey = "about"`, **When** migration completes, **Then** it maps to `brand_story` content model.
3. **Given** existing data has `product_grid_featured`, `product_grid_new_arrivals`, `product_grid_exclusive`, **When** migration completes, **Then** they are consolidated into the `featured_products` section with appropriate `gridType` values.
4. **Given** migration runs, **When** checking section types, **Then** `promo_banner`, `testimonials`, `newsletter` content types and Zod schemas exist.

---

### User Story 5 - Dashboard Removes Drag-and-Drop (Priority: P2)

The merchant dashboard templates page no longer shows drag handles on sections. The `DraggableSectionItem` component is removed. Sections appear in a clean vertical list with accordion editors. The `sortOrder` field is no longer merchant-editable — it is determined by the template's fixed section order. The unsaved changes bar still works for content and visibility edits but no longer tracks order changes.

**Why this priority**: Removing the old flexibility is necessary to enforce the opinionated model, but it's a UI cleanup that can follow the core architecture changes.

**Independent Test**: Can be fully tested by opening the dashboard, verifying no drag handles exist, and confirming sections are in fixed order that cannot be changed.

**Acceptance Scenarios**:

1. **Given** a merchant opens the templates dashboard, **When** they view the section list, **Then** no drag handles or reorder controls are present.
2. **Given** a merchant saves section changes, **When** the save action runs, **Then** `sortOrder` values are set by the system (template-defined), not by merchant input.

---

### User Story 6 - Content Customization Is Text and Images Only (Priority: P2)

Section editors only expose text fields (headlines, descriptions, button labels, button links) and image upload controls. No layout knobs (column count, grid vs mosaic), no style overrides (per-section colors, fonts, backgrounds). The `CategoryShowcaseContent.layout` field is removed. The `AnnouncementBarContent.backgroundColor` and `textColor` fields are removed. Data source selections like `FeaturedProducts.gridType` remain as they are content decisions (what to show), not design decisions (how to show it).

**Why this priority**: This enforces the "merchant is a content editor, not a designer" principle. Important but can be applied incrementally to each section editor.

**Independent Test**: Can be fully tested by opening each section editor and verifying only text/image fields are available — no layout or style controls.

**Acceptance Scenarios**:

1. **Given** a merchant opens the Category Showcase editor, **When** they look for layout options, **Then** no grid/mosaic selector exists — the template controls the layout.
2. **Given** a merchant opens the Announcement Bar editor, **When** they look for color pickers, **Then** no background/text color fields exist — the template controls colors.
3. **Given** a merchant opens the Featured Products editor, **When** they look for the gridType selector, **Then** it remains available because it's a data source selection (content), not a layout choice (design).

---

### Edge Cases

- What happens when a merchant has existing data with the old `about` section key? → Migration maps it to `brand_story`, preserving content.
- What happens when a merchant has 3 product_grid sections with different content? → The first (by sortOrder) becomes the canonical `featured_products` section. The remaining product grid data is preserved in a backup field or discarded with warning.
- What happens when the color rhythm has all optional sections hidden (only 4 core sections remain)? → The rhythm still works — it re-calculates based on visible sections only.
- What happens when new sections (`promo_banner`, `testimonials`, `newsletter`) are added for existing merchants? → Default content is seeded for new sections with `isVisible: false` so they don't appear until the merchant activates them.
- What happens when the `general` template is referenced as the fallback in `getTemplate()`? → The fallback changes to the new default template slug.

## Requirements *(mandatory)*

### Functional Requirements

#### Template System
- **FR-001**: System MUST support exactly ONE active template (renamed from "fashion" to a neutral/premium name) while retaining multi-template infrastructure for future expansion.
- **FR-002**: System MUST delete the `general` and `retail` template directories, their components, styles, and registry entries.
- **FR-003**: The `getTemplate()` fallback MUST change from `templates.general` to the new default template slug.
- **FR-004**: The `merchants.template` column default MUST change from `"general"` to the new template slug.

#### Section Catalog
- **FR-005**: System MUST define exactly 10 universal section types: `announcement_bar`, `hero`, `category_showcase`, `featured_products`, `promo_banner`, `brand_story`, `testimonials`, `newsletter`, `faq`, `footer`.
- **FR-006**: System MUST classify sections as Core (hero, category_showcase, featured_products, footer) or Optional (announcement_bar, promo_banner, brand_story, testimonials, newsletter, faq).
- **FR-007**: Core sections MUST always be visible — the system MUST reject any attempt to set `isVisible: false` on a core section.
- **FR-008**: System MUST add three new content types: `PromoBannerContent`, `TestimonialsContent`, `NewsletterContent` with corresponding Zod validation schemas.
- **FR-009**: System MUST rename the `about` section key to `brand_story` and update all references.
- **FR-010**: System MUST consolidate `product_grid_featured`, `product_grid_new_arrivals`, `product_grid_exclusive` into a single `featured_products` section with a `gridType` field.

#### Content Customization
- **FR-011**: Section content schemas MUST only expose text fields (strings) and image fields (URLs). No layout options, no color pickers, no style overrides.
- **FR-012**: The `CategoryShowcaseContent.layout` field (`grid | mosaic`) MUST be removed — the template controls layout.
- **FR-013**: The `AnnouncementBarContent.backgroundColor` and `textColor` fields MUST be removed — the template controls colors.
- **FR-014**: The `HeroContent.overlayOpacity` field MUST be removed — the template controls overlay styling.
- **FR-015**: Data source selections (e.g., `featured_products.gridType`) MUST remain available to merchants as content-level choices.

#### Fixed Section Order
- **FR-016**: Section order MUST be fixed per template. The template defines display order, not the merchant.
- **FR-017**: The `sortOrder` field MUST NOT be merchant-editable. It is set by the system based on template-defined order.
- **FR-018**: System MUST NOT implement or retain section reordering UI (no drag-and-drop, no move up/down controls).

#### Component Architecture
- **FR-019**: Shared primitive components MUST live in `components/storefront/primitives/` (ProductCard, CategoryCard, TestimonialCard, NewsletterForm, PriceDisplay, StarRating, etc.)
- **FR-020**: Per-template section components MUST live in `templates/<slug>/sections/` (HeroSection, CategoryShowcase, FeaturedProducts, PromoBanner, Footer, etc.)
- **FR-021**: The `TemplateModule` interface MUST include section component declarations alongside page components.
- **FR-022**: The `SectionRenderer` MUST become template-aware — delegating to the active template's section components, with fallback to shared default implementations.

#### Section Layout & Color Rhythm
- **FR-023**: Sections MUST stack vertically. Hidden optional sections MUST collapse out with no remaining gap or space.
- **FR-024**: Each template MUST define a section color rhythm (alternating background themes). The rhythm MUST re-calculate when sections are hidden to prevent visual clashes.

#### Dashboard Editor
- **FR-025**: The templates dashboard MUST show a vertical list of all 10 sections in fixed order.
- **FR-026**: Core sections MUST display a lock icon and no visibility toggle.
- **FR-027**: Optional sections MUST display an on/off toggle switch.
- **FR-028**: Clicking any section MUST expand an inline content editor (accordion pattern).
- **FR-029**: The `DraggableSectionItem` component MUST be removed.
- **FR-030**: Live preview iframe, theme customization (colors, fonts, border radius), and viewport toggles MUST be retained.

### Key Entities

- **StorefrontSection**: Represents a section instance for a merchant. Key attributes: sectionKey (one of 10 fixed values), content (JSONB with text+image fields only), isVisible (toggleable for optional sections only), sortOrder (system-defined, not merchant-editable).
- **TemplateModule**: Extended interface that includes both page components and section component declarations. Each template registers its section renderers.
- **SectionColorRhythm**: Template-defined sequence of background themes that adapts based on which sections are currently visible.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 10 sections render correctly on the storefront homepage in the correct fixed order defined by the template.
- **SC-002**: Toggling optional sections on/off immediately reflects on the storefront with no visual gaps or color rhythm clashes.
- **SC-003**: The dashboard section editor shows exactly 10 sections with lock icons on core sections and toggle switches on optional sections — no drag handles present.
- **SC-004**: Section editors expose only text and image fields — zero layout knobs or style override controls exist in any section editor.
- **SC-005**: The template registry contains exactly one template entry. The `general` and `retail` template directories do not exist.
- **SC-006**: The `TemplateModule` interface includes section component declarations and the SectionRenderer successfully delegates to template-specific section components.
- **SC-007**: Existing merchant section data (if any) migrates cleanly — `about` → `brand_story`, `product_grid_*` → `featured_products`, new sections seeded as hidden.

## Assumptions

- The application is not yet in production — no live merchant data needs to be preserved during migration. This allows destructive changes to schemas and data structures.
- The fashion template's existing visual design is versatile enough to serve as a universal default template when renamed. Fashion-specific editorial touches (lookbook cards, editorial hero) will be generalized into universal premium patterns.
- The multi-template infrastructure (registry, resolver, template picker, DB table, CSS scoping) will be retained even though only one template exists initially. This avoids re-architecture when adding future templates.
- The color rhythm system can be implemented as a CSS-level solution using `:nth-child` selectors or CSS custom properties, without requiring JavaScript to calculate visible section positions.
- The 3 new section types (promo_banner, testimonials, newsletter) will be seeded as hidden (`isVisible: false`) for all merchants, ensuring they don't appear until explicitly activated.
- Existing shared section components (`FullBleedHero`, `CategoryMosaic`, `DynamicProductGrid`, etc.) will be refactored into the new architecture — some becoming per-template section components, others becoming shared primitives.
