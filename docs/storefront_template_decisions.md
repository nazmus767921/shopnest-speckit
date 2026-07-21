# Storefront Template Architecture — Design Decisions

> Decided: 2026-07-15 | Session: Grilling session on template design philosophy

## Problem Statement

The existing storefront template system was too loose and builder-like. Merchants had drag-and-drop reordering, free-form section composition, and a generic `SectionRenderer` that produced inconsistent, non-premium homepages. The goal: achieve pixel-perfect, premium storefront layouts comparable to Squarespace-level design quality.

---

## Decision 1: Opinionation Level → Squarespace-Level

**Choice**: Templates are opinionated. Merchants customize **content** (text, images), not **layout**. The layout structure is fixed per template.

**Rejected alternatives**:
- Shopify-level (too much section/block flexibility → inconsistent results)
- Wix-level (full drag-and-drop → way too complex, never premium)
- Carrd-level (too restrictive, not enough for e-commerce)

**Rationale**: We are the designer, not the merchant. The merchant is a content editor. This produces the most consistently premium results with the least engineering complexity.

---

## Decision 2: Section Flexibility → Core + Optional

**Choice**: Sections are classified as **Core** (always visible, cannot be removed) or **Optional** (toggleable on/off by merchant). No reordering. No adding new sections.

**Rejected alternatives**:
- All sections fixed (merchants hate empty sections they can't fill)
- Full reordering with show/hide (too loose, breaks design intent)

**Rationale**: Core sections ensure the storefront always has a functional, complete structure. Optional sections let merchants hide what's irrelevant (e.g., testimonials for a new store) without breaking the design.

---

## Decision 3: Section Catalog → System-Defined (Universal)

**Choice**: One universal catalog of section types shared across ALL templates. Every template must render all 10 sections in its own style. The core/optional designation is the same across templates.

**Rejected alternative**: Template-defined catalog (each template declares its own sections). Rejected because it fragments the content model and makes template switching harder.

**Rationale**: Merchants can switch templates without losing section content. Simpler DB schema and editor UI. Constrains template designers to a known set of sections.

---

## Decision 4: Universal Section Catalog — 10 Sections

| # | Section Key | Classification | Content Model |
|---|------------|----------------|---------------|
| 1 | `announcement_bar` | **Optional** | text, link, backgroundColor, textColor |
| 2 | `hero` | **Core** | title, subtitle, buttonText, buttonLink, imageUrl, overlayOpacity |
| 3 | `category_showcase` | **Core** | title, categoryIds[] |
| 4 | `featured_products` | **Core** | title, gridType (new_arrivals / featured / exclusive / manual_selection), productIds? |
| 5 | `promo_banner` | **Optional** | title, subtitle, buttonText, buttonLink, imageUrl |
| 6 | `brand_story` | **Optional** | title, description, imageUrl, buttonText, buttonLink |
| 7 | `testimonials` | **Optional** | heading, testimonials[{name, text, rating, avatarUrl}] |
| 8 | `newsletter` | **Optional** | heading, subheading, placeholder, buttonText |
| 9 | `faq` | **Optional** | heading, questions[{question, answer}] |
| 10 | `footer` | **Core** | storeDescription, storeAddress, socialLinks, showPaymentBadges, copyrightText |

**4 Core. 6 Optional.**

> [!NOTE]
> Instagram/Social Feed was deliberately excluded — it's a maintenance burden for merchants and rarely looks good with stale content.

> [!IMPORTANT]
> `gridType` in `featured_products` is a **data source** selection (what products to show), NOT a layout choice. Merchants keep this control. The visual layout of the grid is fixed by the template designer.

---

## Decision 5: Section Layout Model → Vertical Stack + Color Rhythm

**Choice**: Sections stack vertically. When an optional section is hidden, the ones below move up (CSS gap/margin). Each template defines a **section color rhythm** (e.g., `[light, dark, light, accent, light, dark]`) that re-calculates when sections are hidden to prevent visual clashes.

**Rejected alternatives**:
- Designed transitions between sections (exponential design complexity, no major platform does this)
- Section groups with coupled layouts (over-engineered, fragile)

**Rationale**: This is exactly what Shopify, Squarespace, and BigCommerce do. The premium feel comes from **within** each section (typography, imagery, animation, whitespace), not from cross-section visual relationships. Color theming between sections is the cheap win for visual cohesion.

---

## Decision 6: Component Architecture → Hybrid

**Choice**: Shared primitive components (ProductCard, CategoryCard, TestimonialCard, NewsletterForm, etc.) + per-template section components for sections where layout fundamentally differs between templates.

```
Shared Layer (components/storefront/primitives/)
├── ProductCard, CategoryCard, TestimonialCard, NewsletterForm, PriceDisplay, StarRating, ...

Per-Template Sections (templates/<slug>/sections/)
├── HeroSection          ← UNIQUE per template
├── CategoryShowcase     ← UNIQUE per template
├── FeaturedProducts     ← uses shared ProductCard, layout per-template
├── PromoBanner          ← UNIQUE per template
├── BrandStory           ← often shared (text + image, restyled via CSS)
├── Testimonials         ← uses shared TestimonialCard, layout per-template
├── Newsletter           ← often shared (simple form, restyled via CSS)
├── FAQ                  ← shared (accordion, restyled via CSS)
└── Footer               ← per-template
```

**Rule of thumb**: If the section's DOM structure/layout fundamentally changes between templates → per-template component. If it's the same structure just restyled → shared component with template-scoped CSS.

**Rejected alternatives**:
- Fully per-template (Shopify model) — 30+ components for 3 templates, unsustainable for a single team
- Fully shared with CSS theming — constrains design too much, some sections need fundamentally different HTML

**Rationale**: ~4-5 unique sections per template + ~5 shared sections. Each new template costs 4-5 new components instead of 10. Matches headless commerce (Medusa/Saleor/Vendure) best practices.

---

## Decision 7: Multi-Template Architecture → Keep Infra, One Template For Now

**Choice**: Keep the existing multi-template infrastructure (registry, resolver, template picker, DB table, CSS scoping). Delete `general` and `retail` templates. Keep only `fashion`, renamed to a neutral/premium name.

**Rationale**: Architecture is already built and working. Ripping it out to re-add later is wasted effort. App is not in production — no migration concerns.

---

## Decision 8: Template Naming → Rename "Fashion" to Neutral

**Choice**: Rename the fashion template to a neutral/premium name (e.g., "Elegance", "Moderne", "Luxe"). It becomes the universal default template. Fashion-specific design touches (lookbook cards, editorial hero) get generalized into universal premium patterns.

**Rationale**: A merchant selling electronics shouldn't be auto-assigned a "fashion" template. The design is versatile enough to serve all verticals. Vertical-specific templates can be added later.

---

## Decision 9: Dashboard Editor → Accordion List with Toggles

**Choice**: Remove drag-and-drop reordering. The templates dashboard page shows a vertical list of all 10 sections in their fixed order. Core sections show a lock icon. Optional sections show a toggle switch. Clicking any section expands an inline content editor. Live preview remains.

**What stays**: Accordion section editors, live preview iframe, theme customization (colors, fonts, border radius), viewport toggles.

**What's removed**: Drag handles, reorder functionality, `sortOrder` as a merchant-editable field.

---

## Decision 10: Content Customization → Text + Images Only

**Choice**: Merchants can only edit text content (headlines, descriptions, button labels) and images. No layout knobs (column count, grid vs mosaic). No style overrides (per-section colors, fonts, backgrounds). The template designer controls every visual decision.

**Exception**: Data source selections (e.g., `gridType` for featured products — "show new arrivals" vs "show featured") are treated as **content**, not design. Merchants keep control over WHAT data to show, not HOW it's displayed.

**Rejected alternatives**:
- Text + Images + Layout presets (adds complexity, merchants make inconsistent choices)
- Text + Images + Style overrides (Shopify model — fastest path to ugly storefronts)

**Rationale**: Maximum design control = maximum visual consistency = most premium feel. The merchant is a content editor, not a designer.

---

## Architecture Impact Summary

### What Changes
| Component | Current | New |
|-----------|---------|-----|
| `SectionRenderer` | Generic, maps sectionKey → shared component | Template-aware, delegates to active template's section components |
| `templates/` | 3 templates (general, fashion, retail) | 1 template (renamed fashion), others deleted |
| `TemplateModule` interface | 7 page components | 7 page components + section component declarations |
| Dashboard templates page | Drag-and-drop + accordion editors | Accordion editors + toggle switches, no dragging |
| `storefront_sections.sortOrder` | Merchant-editable | Template-defined constant, not merchant-editable |
| Section content schemas | Include layout options (e.g., `layout: grid\|mosaic`) | Text + image fields only, no layout options |
| Section types | 7 types | 10 types (add promo_banner, testimonials, newsletter) |
| Shared section components | All sections shared | ~5 shared, ~5 per-template |

### What Stays
- `storefront_sections` DB table (content JSONB, isVisible toggle)
- `store_templates` DB table (registry, tier gating)
- Template resolver pattern (`getTemplate()`)
- CSS scoping via `.storefront-template-<slug>`
- Theme settings (colors, fonts, border radius)
- Live preview system (iframe + postMessage)
- Cache layer (`getCachedStorefrontSections`)

### New Additions
- `components/storefront/primitives/` — shared atomic components
- `templates/<slug>/sections/` — per-template section components
- Section color rhythm system — template-defined color sequence that adapts to hidden sections
- Core/optional section classification in the section catalog
- 3 new section types: `promo_banner`, `testimonials`, `newsletter`
