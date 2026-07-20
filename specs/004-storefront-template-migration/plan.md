# Implementation Plan: Storefront Template Architecture Migration

**Branch**: `004-storefront-template-migration` | **Date**: 2026-07-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-storefront-template-migration/spec.md`

## Summary

Migrate the storefront template system from a loose, builder-like architecture (3 templates, 7 section types, drag-and-drop reordering, generic SectionRenderer) to a Squarespace-level opinionated system (1 template, 10 section types, fixed order, core/optional classification, hybrid component architecture, text+images-only content customization). This requires deleting the `general` and `retail` templates, renaming `fashion` to a neutral premium name, consolidating product grid sections, adding 3 new section types, stripping layout/style fields from content schemas, removing drag-and-drop from the dashboard, and introducing a template-aware section rendering system with per-template section components and shared primitives.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19, Next.js 16

**Primary Dependencies**: Drizzle ORM, Zod, Shadcn UI, `@dnd-kit/sortable` (to be removed), Next.js App Router

**Storage**: Supabase Postgres — `storefront_sections` table (JSONB content), `store_templates` table, `merchants.template` column

**Testing**: Vitest (unit + integration)

**Target Platform**: Web — Next.js server (RSC) + client leaves

**Project Type**: Multi-tenant SaaS web application (Next.js App Router)

**Performance Goals**: Storefront pages should render within standard web performance budgets. Section toggling should reflect immediately on storefront.

**Constraints**: RSC by default. `"use client"` isolated to interactive leaves. `"use cache"` only on data-fetching functions. No manual `useMemo`/`useCallback`.

**Scale/Scope**: Multi-tenant e-commerce platform. This migration touches ~30 files across 7 directories.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Library-First & RSC | ✅ PASS | Section types/schemas are standalone library code in `lib/`. Section components remain RSC. Icons from `@/lib/icons`. |
| II. TDD | ✅ PASS | Integration tests required for new Zod schemas, section type validation, and core/optional enforcement. |
| III. Component Consistency | ✅ PASS | Dashboard UI uses Shadcn UI primitives. Storefront section components are custom (not dashboard primitives). |
| IV. Caching | ✅ PASS | `getCachedStorefrontSections` uses `"use cache"` with `cacheTag`. No changes to caching strategy. |
| V. DB & Validation | ✅ PASS | Drizzle ORM for schema. Zod for all section content validation. `error.issues[0].message` for errors. |
| Security & Multi-Tenant | ✅ PASS | All section queries filter by `merchant_id` from server session. No change to isolation model. |
| Transactional Integrity | ✅ PASS | Section save uses transaction (DELETE-all + INSERT-all). No stock/price implications. |

**No violations. Gate PASSED.**

## Project Structure

### Documentation (this feature)

```text
specs/004-storefront-template-migration/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: research decisions
├── data-model.md        # Phase 1: data model changes
├── quickstart.md        # Phase 1: validation guide
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
# Section Types & Validation (Library Layer)
lib/
├── storefront-sections/
│   ├── types.ts                    # [MODIFY] Add 3 new content types, rename about→brand_story, consolidate product grids
│   ├── defaults.ts                 # [MODIFY] Update to 10 sections, new defaults, fixed sortOrder
│   └── section-catalog.ts          # [NEW] Core/optional classification, section metadata
├── validations/
│   └── storefront-sections.ts      # [MODIFY] Add 3 new schemas, strip layout/style fields
├── cache/
│   └── storefront.ts               # [NO CHANGE] Cache layer stays
├── theme.ts                        # [NO CHANGE]
└── fonts.ts                        # [NO CHANGE]

# Shared Storefront Primitives
components/storefront/
├── primitives/                     # [NEW] Shared atomic components
│   ├── ProductCard.tsx             # [NEW] Extracted from fashion template
│   ├── CategoryCard.tsx            # [NEW] Extracted from shared components
│   ├── TestimonialCard.tsx         # [NEW]
│   ├── NewsletterForm.tsx          # [NEW]
│   ├── PriceDisplay.tsx            # [MOVE] If exists, consolidate here
│   └── StarRating.tsx              # [MOVE] If exists, consolidate here
├── sections/
│   ├── SectionRenderer.tsx         # [MODIFY] Becomes template-aware, delegates to template section components
│   ├── PreviewSectionRenderer.tsx  # [MODIFY] Update for new section keys
│   ├── BrandStory.tsx              # [KEEP] Shared section (renamed from about context)
│   ├── FaqSection.tsx              # [KEEP] Shared section
│   ├── Newsletter.tsx              # [NEW] Shared section
│   ├── AnnouncementMarquee.tsx     # [KEEP] Shared section
│   ├── FullBleedHero.tsx           # [DEPRECATE] Replaced by per-template HeroSection
│   ├── CategoryMosaic.tsx          # [DEPRECATE] Replaced by per-template CategoryShowcase
│   └── DynamicProductGrid.tsx      # [DEPRECATE] Replaced by per-template FeaturedProducts

# Template System
templates/
├── types.ts                        # [MODIFY] Add section component declarations to TemplateModule
├── registry.ts                     # [MODIFY] Remove general/retail, add renamed fashion, change fallback
├── general/                        # [DELETE] Entire directory
├── retail/                         # [DELETE] Entire directory
└── <new-slug>/                     # [RENAME] fashion → neutral name (e.g., "elegance")
    ├── index.ts                    # [MODIFY] Export section components
    ├── styles.css                  # [MODIFY] Update CSS scoping class
    ├── sections/                   # [NEW] Per-template section components
    │   ├── HeroSection.tsx         # [NEW] Template-specific hero
    │   ├── CategoryShowcase.tsx    # [NEW] Template-specific category display
    │   ├── FeaturedProducts.tsx    # [NEW] Template-specific product grid
    │   ├── PromoBanner.tsx         # [NEW] Template-specific promo
    │   └── FooterSection.tsx       # [RENAME] From FashionFooter.tsx
    ├── <existing page components>  # [KEEP] PLP, PDP, Cart, Navbar, StandardPage
    └── components/                 # [KEEP] Template-specific sub-components

# Database
db/
├── schema.ts                       # [MODIFY] merchants.template default, no structural changes to storefront_sections
└── queries/
    ├── storefront-sections.ts      # [MODIFY] Add core section enforcement
    └── templates.ts                # [NO CHANGE]

# Server Actions
app/actions/
└── storefront-sections.ts          # [MODIFY] Enforce core visibility, use fixed sortOrder

# Storefront Routes
app/(storefront)/[subdomain]/
├── layout.tsx                      # [MODIFY] Remove general/retail CSS imports, update fallback template
└── page.tsx                        # [NO CHANGE] Already delegates to templateModule.HomePage

# Dashboard
app/(dashboard)/dashboard/templates/
├── page.tsx                        # [MINOR] No structural changes
└── components/
    ├── TemplatesPageClient.tsx      # [MODIFY] Remove drag-and-drop, enforce fixed order
    ├── SectionEditors.tsx           # [MODIFY] Strip layout/style fields, add new section editors
    ├── DraggableSectionItem.tsx     # [DELETE] Drag-and-drop component
    ├── PreviewPane.tsx              # [MINOR] Update section key references
    ├── TemplatePicker.tsx           # [MINOR] Only one template available
    ├── TemplatesSkeleton.tsx        # [NO CHANGE]
    └── UnsavedChangesBar.tsx        # [NO CHANGE]
```

**Structure Decision**: Next.js App Router with library-first approach. Section types, validation, and catalog metadata live in `lib/`. Shared primitives in `components/storefront/primitives/`. Per-template sections in `templates/<slug>/sections/`. Dashboard UI in app routes.

## Complexity Tracking

> No constitution violations detected. No complexity justification needed.
