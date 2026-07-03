# Implementation Plan: Product Variants & Custom Metadata

**Branch**: `20-product-variants-metadata` | **Date**: 2026-07-03 | **Spec**: `specs/20-product-variants-metadata/spec.md`

**Input**: Feature specification from `specs/20-product-variants-metadata/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

**UX Model (per Clarifications 2026-07-03)**: Shopify-style inline table with chip option inputs. No wizard, no modals. Attributes are added as columns via inline "+" button; option values typed as chips/pills (removable tags). Variants populate instantly in the same table. SKU/price/stock cells are click-to-edit inline. Bulk toolbar with checkbox selection for mass price/stock adjustments. Search/filter bar for attribute combination filtering. Smart merge on attribute changes (preserve existing edits, add new variants, deactivate removed ones).

## Summary

Extend ShopNest's product system to support auto-generated variants from custom
attributes and per-product custom metadata. Merchants define attributes (Color,
Size, etc.) with option values, the system generates the full variant matrix,
and merchants override price/stock/SKU/images per variant. Custom metadata adds
key-value display fields per product. Cart, checkout, stock tracking, and the
dashboard product editor are updated to be variant-aware.

## Technical Context

**Language/Version**: TypeScript (strict mode), Next.js 16.2.9, React 19.2.4

**Primary Dependencies**:
- Drizzle ORM (new tables: `product_attributes`, `attribute_options`, `product_variants`, `product_metadata`)
- Zod v4 (variant selection validation, attribute schema validation)
- TanStack Query v5+ (variant data fetching on storefront/dashboard)
- TanStack Form v1 (variant editor forms in dashboard)

**Storage**: Supabase Postgres (variant tables + variant stock), Supabase Storage
(variant images in `product-images` bucket with variant path segment)

**Testing**: Vitest + React Testing Library + jsdom (existing setup, `pnpm test`)

**Target Platform**: Web (Next.js App Router, mobile-first responsive)

**Project Type**: Web application (Next.js full-stack)

**Performance Goals**:
- Variant matrix generation for up to 3 attributes × 10 options (max 1000 variants)
  should compute in <100ms client-side
- Inline variant table should feel instant — chip entry → matrix population in <50ms
- Storefront variant loading should be instant via TanStack Query cache
- Checkout variant stock decrement must be atomic (Postgres transaction guard)
- **SC-001 goal**: Define 2 attributes × 3 options, see 9 variants, edit prices — all in under **2 minutes**

**Constraints**:
- Must not break existing non-variant products — backward compatible schema
- Stock atomicity invariant extends to variant stock
- Variant price must be snapshotted in `order_items` at checkout (same invariant as base products)
- Must respect existing plan limits (base product counts as 1 toward limit; variants are free — per FR-015)
- Variant image uploads reuse existing Supabase Storage bucket with extended naming convention
- **Smart merge constraint**: When attributes change, do NOT delete existing variants. Preserve price/SKU/stock overrides on surviving variants; add new variants for new options; deactivate variants for removed options
- **Bulk operations required**: Bulk toolbar with checkbox selection for price adjustment, stock set, SKU prefix changes, and bulk activate/deactivate
- **Search/filter required**: Filter by attribute combination, SKU search, stock level filter
- **Save/trigger model**: Chip changes auto-persist after 500ms debounce. Inline cell edits save on Enter, Tab, or blur. Escape reverts to original value. No explicit "Save" button for the variant table.

**Scale/Scope**: All merchants with variant-capable products across 50+ concurrent merchants

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment | Status |
|-----------|-----------|--------|
| **I. Library-First** | Variant matrix computation (Cartesian product), smart merge algorithm, and variant selection logic MUST be extracted to standalone libraries (`lib/products/variants.ts`, `lib/products/attributes.ts`). No inline matrix generation in page components. Smart merge is a pure algorithm — given old attributes + new attributes + existing variants, it returns diff (add, deactivate, preserve). | ✅ PASS |
| **II. Functional Programming** | Variant matrix generation is a pure function — Cartesian product of attribute options — trivially testable and side-effect-free. Smart merge is also pure. Per-variant mutations (price, stock) are isolated at the DB boundary via Drizzle queries. Bulk toolbar actions are thin wrappers over Drizzle batch updates. | ✅ PASS |
| **III. Test-First** | Variant matrix generation, smart merge, variant selection, and variant stock decrement are ideal TDD candidates. Tests MUST be written before implementation, approved, confirmed failing, then implemented. | ✅ PASS |
| **IV. Integration Testing** | Required for: variant-aware checkout (stock atomicity across variants), variant image upload flow, variant-to-order-item mapping, bulk operations, smart merge correctness. | ✅ PASS |
| **V. Invariants** | Invariant 2 (stock non-negative) extends to variant stock — must use Postgres transaction guard. Invariant 3 (price snapshotted) applies to variant price. Invariant 1 (merchant_id) applies to all variant queries. Invariant 8 (UI primitives) applies to variant selectors and variant table components. Invariant 9 (DESIGN.md First) applies to the inline variant table, chip inputs, bulk toolbar, and filter bar. | ✅ PASS |
| **Scope Boundaries** | Previously listed as V2 (deliberately deferred). The user explicitly requested this feature now — it is now in scope. Added clarifications: bulk toolbar (FR-015), search/filter (FR-016), smart merge. No V3/V4 features (variant-specific metadata, CSV import/export) are included. | ✅ PASS |

**Gates passed**: ✓ No violations. Complexity (new entities, auto-generation algorithm) is justified by the user's explicit request to extend the product.

## Project Structure

### Documentation (this feature)

```text
specs/20-product-variants-metadata/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
lib/
├── products/
│   ├── variants.ts          # Variant matrix generation, selection logic, smart merge
│   ├── attributes.ts        # Attribute CRUD, option management, smart merge
│   └── metadata.ts          # Custom metadata CRUD

db/
├── schema.ts                # New tables: product_attributes, attribute_options,
│                            #   product_variants, variant_images, product_metadata
├── migrations/              # Drizzle Kit migration for new tables
└── queries/
    ├── products.ts          # Extended with variant queries
    └── variants.ts          # Variant-specific queries (NEW)

components/
├── dashboard/
│   ├── product-variant-editor/
│   │   ├── VariantsSection.tsx      # Single unified view: inline table editor + chips
│   │   ├── VariantRowEditor.tsx     # Expandable variant row with inline editing
│   │   ├── VariantBulkToolbar.tsx   # Bulk actions toolbar (NEW)
│   │   ├── VariantFilterBar.tsx     # Search/filter controls (NEW)
│   │   ├── VariantImageUpload.tsx   # Per-variant image upload
│   │   ├── MetadataEditor.tsx       # Custom metadata editor
│   │   └── MetadataSection.tsx      # Metadata display in dashboard
│   └── attribute-editor/
│       └── AttributeEditor.tsx      # Chip-based attribute & option input
├── storefront/
│   ├── variant-selector/            # Swatch/dropdown variant picker
│   └── product-metadata/            # Metadata display section
└── shared/
    └── variant-price-display/       # Price display for either variant or base

app/
├── (dashboard)/products/
│   ├── [id]/edit/                   # Extended with inline variant table section
│   └── new/                         # Extended with attribute definition
└── (storefront)/product/[slug]/
    └── page.tsx                     # Extended with variant selector + metadata
```

**Structure Decision**: Single Next.js repo with new library files under
`lib/products/`, new query files under `db/queries/variants.ts`, new components
in `components/dashboard/` and `components/storefront/`, and extended existing
pages. The variant matrix generation is extracted as a pure library function in
`lib/products/variants.ts`.

**Key UX Difference from V1 plan**: The original 3-step wizard (Define → Generate → Manage) is replaced with a single unified inline table:
1. Above the table: attribute chip inputs — click "Add option like Size", type option names as chips, press Enter to add, click × to remove
2. Below: variant table populates instantly as chips change — no "Generate" button
3. Click any cell (SKU, price, stock) to edit inline
4. Bulk toolbar shows when ≥1 variant rows checked — price adjustments, stock set, bulk actions
5. Smart merge on attribute change — existing price/stock edits preserved

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 4 new DB tables (product_attributes, attribute_options, product_variants, product_metadata) | The variant matrix is a cross-product of attributes — this requires normalized relational storage for flexibility (merchants define arbitrary attributes) | JSON blob on products table would not support per-variant stock tracking, per-variant pricing queries, or efficient variant availability lookups |
| Client-side variant matrix generation algorithm | Merchants need instant feedback when adding/removing attribute options during product editing | Server-side generation would add latency on every attribute change and require full page reload; the matrix is a pure Cartesian product computable in <100ms for realistic sizes |
| Smart merge algorithm (preserve existing edits on attribute change) | Prevents data loss — merchants who've set variant prices shouldn't lose them when adding a new color option | Full regeneration (delete all variants and recreate) is simpler to implement but destroys per-variant customizations (prices, stock, SKU overrides). This would violate FR-004 (per-variant overrides must survive edits) |
| Bulk toolbar + search/filter bar | Required for usability with 9+ variants (up to 1000). Merchants need to quickly find, filter, and mass-update variants | No bulk toolbar and rely on individual inline editing only — too slow for 27+ variants, violates SC-001 (2-minute setup goal) |
| Chip-based attribute option input | Fastest way to enter option values — type and press Enter to add, click × to remove. Proven by Shopify. | Dropdown select or multi-input fields require more clicks per option and break the flow of entering multiple values quickly |
| Variant selector component (storefront) | Customers must select variants before adding to cart — this requires interactive UI state (selected options, availability checking) | Redirecting to separate variant pages would add friction and page loads for each variant view |
