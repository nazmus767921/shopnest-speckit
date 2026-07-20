# Research: Storefront Template Architecture Migration

**Date**: 2026-07-18 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Research Summary

All technical decisions for this migration were pre-resolved during the architectural grilling session (2026-07-15). This document captures the research findings that validate those decisions against the actual codebase state.

---

## R1: Template Naming — What to rename "fashion" to

**Decision**: Rename `fashion` template slug to `elegance`

**Rationale**:
- Must be vertical-agnostic (not "fashion", "retail", "general")
- Must convey premium quality
- Must work as a CSS class name (`.storefront-template-elegance`)
- Must work as a DB slug (`merchants.template = "elegance"`)
- "Elegance" communicates sophistication without vertical specificity
- Alternative candidates considered: "Moderne" (too abstract), "Luxe" (too niche), "Standard" (too generic), "Premium" (conflicts with subscription tier naming)

**Impact**: Affects `templates/` directory name, CSS class, `merchants.template` DB default, `store_templates` DB row, registry key, layout.tsx imports, and all references to "fashion" in code.

---

## R2: Section Key Consolidation — product_grid_* → featured_products

**Decision**: Consolidate 3 separate product grid keys into 1 `featured_products` section

**Rationale**:
- Current state: `product_grid_featured` (sortOrder 4), `product_grid_new_arrivals` (sortOrder 5), `product_grid_exclusive` (sortOrder 6, hidden)
- Target: Single `featured_products` section with `gridType: 'new_arrivals' | 'featured' | 'exclusive' | 'manual_selection'`
- The merchant chooses WHAT products to show (data source = content), the template controls HOW (layout = design)
- Having 3 separate sections for different product grids contradicts the fixed 10-section catalog

**Migration strategy**:
- Take the `product_grid_featured` section's content as the canonical `featured_products` content
- Preserve `gridType` field value
- Discard `product_grid_new_arrivals` and `product_grid_exclusive` rows (no production data exists)

---

## R3: Section Key Rename — about → brand_story

**Decision**: Rename `about` section key to `brand_story`

**Rationale**:
- "Brand Story" better communicates the section's purpose (narrative + image, not a generic "about" page)
- Aligns with the fixed section catalog naming convention
- Content schema (`AboutContent`) maps 1:1 to the new `BrandStoryContent` — same fields, just renamed type

**Impact**: `sectionKey` values in DB, `defaults.ts`, `types.ts`, `SectionRenderer`, `SectionEditors`, `PreviewSectionRenderer`

---

## R4: Layout/Style Fields to Strip from Content Schemas

**Decision**: Remove all layout and style fields from section content types

**Research findings** — fields to remove:

| Section | Field | Reason |
|---------|-------|--------|
| `CategoryShowcaseContent` | `layout: 'grid' \| 'mosaic'` | Layout decision belongs to template designer |
| `AnnouncementBarContent` | `backgroundColor: string` | Color controlled by template/theme |
| `AnnouncementBarContent` | `textColor: string` | Color controlled by template/theme |
| `HeroContent` | `overlayOpacity: number` | Visual styling controlled by template |

**Fields to KEEP** (they are content/data, not design):

| Section | Field | Reason |
|---------|-------|--------|
| `ProductGridContent` → `FeaturedProductsContent` | `gridType` | Data source selection (what to show) |
| `FooterContent` | `showPaymentBadges: boolean` | Content toggle (what to show), not design |
| `FooterContent` | `socialLinks` | Content data |

---

## R5: Drag-and-Drop Removal — @dnd-kit/sortable

**Decision**: Remove `@dnd-kit/sortable` integration from dashboard

**Research findings**:
- `DraggableSectionItem.tsx` uses `useSortable` from `@dnd-kit/sortable`
- `TemplatesPageClient.tsx` has `handleDragEnd` logic that recomputes `sortOrder` values
- `DragOverlay` component renders during drag operations
- The entire `@dnd-kit` dependency can potentially be removed from `package.json` if no other features use it (need to verify)

**Migration strategy**:
1. Delete `DraggableSectionItem.tsx`
2. Remove all `@dnd-kit` imports from `TemplatesPageClient.tsx`
3. Replace draggable section list with static list showing fixed order
4. Add lock icon (core) and toggle switch (optional) to each section item
5. Check if `@dnd-kit` is used elsewhere — if not, remove from dependencies

---

## R6: New Section Content Types Design

**Decision**: Add 3 new section content types

### PromoBannerContent
```
title: string
subtitle?: string
buttonText?: string
buttonLink?: string
imageUrl?: string
```
Rationale: Mirrors HeroContent structure but semantically represents a mid-page promotional callout. Simpler than hero (no overlay).

### TestimonialsContent
```
heading?: string
testimonials: Array<{
  name: string
  text: string
  rating?: number
  avatarUrl?: string
}>
```
Rationale: Array of testimonial items with text + optional avatar. Rating is content (what to display), not design.

### NewsletterContent
```
heading?: string
subheading?: string
placeholder?: string
buttonText?: string
```
Rationale: Minimal content for an email capture form. The actual form submission is handled by the storefront's newsletter integration, not the content model.

---

## R7: SectionRenderer → Template-Aware Rendering

**Decision**: SectionRenderer delegates to template's section components with shared fallbacks

**Current state**: `SectionRenderer` has a `switch` statement mapping `sectionKey` → shared component. All templates use the same renderer.

**Target architecture**:
1. `TemplateModule` interface gains a `sections` property — a record mapping section keys to React components
2. `SectionRenderer` receives the active `TemplateModule` and looks up section components from it
3. If a template doesn't provide a component for a section key, fall back to a shared default implementation
4. The `HomePage` component passes the template module to the renderer

**Rendering flow**:
```
HomePage → SectionRenderer(templateModule, sections)
  → For each visible section in fixed order:
    → templateModule.sections[sectionKey] || sharedDefaults[sectionKey]
    → Render component with section.content as props
```

---

## R8: Color Rhythm System Design

**Decision**: CSS-based color rhythm using data attributes and template-scoped styles

**Approach**:
1. Each template defines a color palette with 2-3 alternating background themes (e.g., `light`, `dark`, `accent`)
2. When rendering sections, the server assigns a `data-rhythm="light|dark|accent"` attribute based on the section's position among VISIBLE sections (not all sections)
3. The template's CSS maps `[data-rhythm="dark"]` to specific background/text colors
4. When sections are hidden, the rhythm indices shift — ensuring no two adjacent sections share the same background theme

**Why CSS-based**: No client-side JavaScript needed. The server calculates visible section positions and assigns rhythm indices. CSS handles the rest. Compatible with RSC.

**Implementation**: A utility function `assignColorRhythm(visibleSections: string[], rhythmPattern: string[])` returns a `Record<string, string>` mapping sectionKey → rhythm value. Called at render time in the HomePage component.

---

## R9: Shared vs Per-Template Section Breakdown

**Decision**: Based on codebase analysis of existing components

| Section | Ownership | Reason |
|---------|-----------|--------|
| `announcement_bar` | **Shared** | Simple text strip — same DOM structure, restyled via CSS |
| `hero` | **Per-template** | Layout fundamentally differs (editorial vs banner vs carousel) |
| `category_showcase` | **Per-template** | Layout fundamentally differs (mosaic vs grid vs circles) |
| `featured_products` | **Per-template** | Grid layout differs, but uses shared `ProductCard` primitive |
| `promo_banner` | **Per-template** | Visual treatment varies significantly |
| `brand_story` | **Shared** | Text + image layout — same structure, restyled via CSS |
| `testimonials` | **Shared** | Uses shared `TestimonialCard`, layout is simple grid/stack |
| `newsletter` | **Shared** | Simple form — same DOM, restyled via CSS |
| `faq` | **Shared** | Accordion pattern — identical structure everywhere |
| `footer` | **Per-template** | Already per-template in current codebase |

**Result for the `elegance` template**: 5 per-template sections + 5 shared sections = 10 total.
