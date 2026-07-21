# Tasks: Storefront Template Architecture Migration

**Input**: Design documents from `specs/004-storefront-template-migration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Included — the constitution mandates TDD. Tests must fail before implementation.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Delete old templates, rename fashion, update registry and DB defaults

- [x] T001 Delete `templates/general/` directory and all contents
- [x] T002 [P] Delete `templates/retail/` directory and all contents
- [x] T003 Rename `templates/fashion/` directory to `templates/elegance/`
- [x] T004 Create `templates/elegance/sections/` directory for per-template section components
- [x] T005 [P] Create `components/storefront/primitives/` directory for shared atomic components
- [x] T006 Update template registry to remove general/retail and register elegance with correct fallback in `templates/registry.ts`
- [x] T007 [P] Update `merchants.template` column default from `"general"` to `"elegance"` in `db/schema.ts`
- [x] T008 Remove `@/templates/general/styles.css` and `@/templates/retail/styles.css` imports from `app/(storefront)/[subdomain]/layout.tsx`
- [x] T009 [P] Update CSS scoping class from `.storefront-template-fashion` to `.storefront-template-elegance` in `templates/elegance/styles.css`
- [x] T010 Rename all `Fashion*` component file names and exports in `templates/elegance/` to `Elegance*` (e.g., `FashionHomePage` → `EleganceHomePage`, `FashionPLP` → `ElegancePLP`, etc.)
- [x] T011 Update `templates/elegance/index.ts` to export renamed components

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: New section types, catalog, schemas, and rendering contract — MUST complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Section Catalog & Types

- [x] T012 Create section catalog constant with core/optional classification, fixed sort order, and labels in `lib/storefront-sections/section-catalog.ts`
- [x] T013 Add `PromoBannerContent` type to `lib/storefront-sections/types.ts` with fields: title, subtitle?, buttonText?, buttonLink?, imageUrl?
- [x] T014 [P] Add `TestimonialsContent` type to `lib/storefront-sections/types.ts` with nested testimonial array (name, text, rating?, avatarUrl?)
- [x] T015 [P] Add `NewsletterContent` type to `lib/storefront-sections/types.ts` with fields: heading?, subheading?, placeholder?, buttonText?
- [x] T016 Rename `AboutContent` to `BrandStoryContent` and `ProductGridContent` to `FeaturedProductsContent` in `lib/storefront-sections/types.ts`
- [x] T017 Remove layout/style fields: `HeroContent.overlayOpacity`, `AnnouncementBarContent.backgroundColor/textColor`, `CategoryShowcaseContent.layout` in `lib/storefront-sections/types.ts`
- [x] T018 Update `StorefrontSectionContent` union type to include all 10 content types in `lib/storefront-sections/types.ts`

### Zod Validation Schemas

- [x] T019 Add `promoBannerContentSchema` to `lib/validations/storefront-sections.ts`
- [x] T020 [P] Add `testimonialsContentSchema` with nested array validation to `lib/validations/storefront-sections.ts`
- [x] T021 [P] Add `newsletterContentSchema` with defaults to `lib/validations/storefront-sections.ts`
- [x] T022 [P] Add `featuredProductsContentSchema` with gridType enum validation to `lib/validations/storefront-sections.ts`
- [x] T023 Rename `aboutContentSchema` → `brandStoryContentSchema` in `lib/validations/storefront-sections.ts`
- [x] T024 Strip `overlayOpacity` from `heroContentSchema`, `backgroundColor/textColor` from `announcementBarContentSchema`, `layout` from `categoryShowcaseContentSchema` in `lib/validations/storefront-sections.ts`

### Default Sections

- [ ] T025 Rewrite `lib/storefront-sections/defaults.ts` with all 10 sections: rename `about` → `brand_story`, consolidate `product_grid_*` → `featured_products`, add `promo_banner`/`testimonials`/`newsletter` (hidden by default), use catalog-defined sortOrder values

### TemplateModule Interface

- [ ] T026 Extend `TemplateModule` interface in `templates/types.ts` to include `sections: Partial<Record<SectionKey, React.ComponentType<SectionProps>>>` and define `SectionProps` and `SectionKey` types

### Template-Aware SectionRenderer

- [x] T027 Refactor `components/storefront/sections/SectionRenderer.tsx` to accept `TemplateModule` and delegate rendering to `templateModule.sections[sectionKey]` with fallback to shared defaults
- [x] T028 [P] Update `components/storefront/sections/PreviewSectionRenderer.tsx` to use new section keys (rename `about` → `brand_story`, add `promo_banner`/`testimonials`/`newsletter`, remove `product_grid_*` variants)

### Color Rhythm Utility

- [x] T029 Create `lib/storefront-sections/color-rhythm.ts` with `assignColorRhythm(visibleSectionKeys: string[], rhythmPattern: string[])` utility that returns `Record<string, string>` mapping sectionKey → rhythm value

### Server Action Enforcement

- [x] T030 Update `saveStorefrontSectionsAction` in `app/actions/storefront-sections.ts` to: (a) reject `isVisible: false` for core sections, (b) override merchant `sortOrder` with catalog-defined values, (c) validate against new schemas
- [x] T031 [P] Update `seedDefaultSectionsAction` in `app/actions/storefront-sections.ts` to seed all 10 default sections

**Checkpoint**: Foundation ready — all 10 section types defined, validated, rendered. User story implementation can now begin.

---

## Phase 3: User Story 1 - Merchant Edits Section Content (Priority: P1) 🎯 MVP

**Goal**: Merchant opens dashboard, sees 10 sections in fixed order, edits text/image content, preview updates live

**Independent Test**: Open `/dashboard/templates`, expand any section, change text/image fields, verify preview updates and data persists

### Unit Tests (Validation)
- [x] T032 [P] [US1] Write unit test for section catalog validation (10 sections, 4 core, 6 optional, correct sortOrder) in `lib/storefront-sections/__tests__/section-catalog.test.ts`
- [x] T033 [P] [US1] Write unit test for all 10 Zod content schemas (valid/invalid inputs, stripped fields rejected) in `lib/validations/__tests__/storefront-sections.test.ts`
- [x] T034 [P] [US1] Write unit test for default sections (10 entries, correct keys, visibility, sortOrder) in `lib/storefront-sections/__tests__/defaults.test.ts`

### Dashboard Editor Refactoring
- [x] T035 [US1] Refactor `SectionEditors.tsx` in `app/(dashboard)/dashboard/templates/components/SectionEditors.tsx`: strip layout/style fields (remove category layout picker, announcement color pickers, hero overlay slider), rename `about` editor → `brand_story` editor, add `promo_banner`/`testimonials`/`newsletter` editors with text+image fields only
- [x] T036 [US1] Delete `app/(dashboard)/dashboard/templates/components/DraggableSectionItem.tsx`
- [x] T037 [US1] Refactor `TemplatesPageClient.tsx` in `app/(dashboard)/dashboard/templates/components/TemplatesPageClient.tsx`: remove all `@dnd-kit` imports and drag-and-drop logic (`handleDragEnd`, `DragOverlay`, `DndContext`, `SortableContext`), replace draggable section list with static list in catalog-defined order, show lock icon for core sections, show toggle switch for optional sections
- [x] T038 [US1] Update `PreviewPane.tsx` in `app/(dashboard)/dashboard/templates/components/PreviewPane.tsx` to reference new section keys (`brand_story`, `featured_products`, `promo_banner`, `testimonials`, `newsletter`)
- [x] T039 [US1] Verify accordion expand/collapse works for all 10 sections and content changes trigger live preview postMessage updates

**Checkpoint**: Dashboard shows 10 sections in fixed order with text/image-only editors, no drag-and-drop. Content edits persist and preview updates.

---

## Phase 4: User Story 2 - Merchant Toggles Optional Sections (Priority: P1)

**Goal**: Merchant toggles optional sections on/off, storefront reflects changes, color rhythm adapts, content preserved

**Independent Test**: Toggle testimonials off → verify not rendered on storefront → toggle back on → verify content restored

### Tests for User Story 2

- [x] T040 [P] [US2] Write integration test for `saveStorefrontSectionsAction`: core sections reject `isVisible: false`, optional sections accept toggle, sortOrder overridden by catalog in `app/actions/__tests__/storefront-sections.test.ts`
- [x] T041 [P] [US2] Write unit test for color rhythm utility: verify rhythm recalculates when sections hidden, no adjacent duplicates in `lib/storefront-sections/__tests__/color-rhythm.test.ts`

### Implementation for User Story 2

- [x] T042 [US2] Implement toggle switch UI component in `TemplatesPageClient.tsx` — optional sections get on/off switch, core sections get lock icon with tooltip "Always visible"
- [x] T043 [US2] Wire toggle state to section `isVisible` field in the sections state array, save via `saveStorefrontSectionsAction`
- [x] T044 [US2] Integrate color rhythm in `EleganceHomePage.tsx`: call `assignColorRhythm()` with visible section keys, pass rhythm data attributes to section wrapper divs
- [x] T045 [US2] Add color rhythm CSS rules to `templates/elegance/styles.css` mapping `[data-rhythm="light"]`, `[data-rhythm="dark"]`, `[data-rhythm="accent"]` to background/text colors

**Checkpoint**: Optional sections toggleable. Storefront hides toggled-off sections. Color rhythm adapts. Content preserved across toggles.

---

## Phase 5: User Story 3 - Storefront Renders with New Template (Priority: P1)

**Goal**: Storefront homepage renders all visible sections using elegance template's per-template section components and shared primitives

**Independent Test**: Visit storefront URL, verify all 10 sections render in correct order with template-specific visual style

### Tests for User Story 3

- [x] T046 [P] [US3] Write unit test for template registry: `getTemplate("elegance")` works, unknown slugs fall back to elegance in `templates/__tests__/registry.test.ts`
- [x] T047 [P] [US3] Write unit test for `TemplateModule.sections` presence: elegance exports section components for per-template sections in `templates/elegance/__tests__/index.test.ts`

### Shared Primitives

- [x] T048 [P] [US3] Extract/create `ProductCard` shared primitive in `components/storefront/primitives/ProductCard.tsx` (extract common logic from `FashionProductCard.tsx`)
- [x] T049 [P] [US3] Create `CategoryCard` shared primitive in `components/storefront/primitives/CategoryCard.tsx`
- [x] T050 [P] [US3] Create `TestimonialCard` shared primitive in `components/storefront/primitives/TestimonialCard.tsx`
- [x] T051 [P] [US3] Create `NewsletterForm` shared primitive in `components/storefront/primitives/NewsletterForm.tsx`

### Per-Template Section Components (Elegance)

- [x] T052 [P] [US3] Create `HeroSection` per-template component in `templates/elegance/sections/HeroSection.tsx` — refactor from existing `FullBleedHero` with elegance-specific styling
- [x] T053 [P] [US3] Create `CategoryShowcase` per-template component in `templates/elegance/sections/CategoryShowcase.tsx` — refactor from existing `CategoryMosaic` with elegance-specific layout
- [x] T054 [P] [US3] Create `FeaturedProducts` per-template component in `templates/elegance/sections/FeaturedProducts.tsx` — uses shared `ProductCard`, elegance-specific grid layout
- [x] T055 [P] [US3] Create `PromoBanner` per-template component in `templates/elegance/sections/PromoBanner.tsx`
- [x] T056 [P] [US3] Move/rename `FashionFooter.tsx` → `templates/elegance/sections/FooterSection.tsx` and update exports

### Shared Section Defaults

- [x] T057 [P] [US3] Create shared `Newsletter` section component in `components/storefront/sections/Newsletter.tsx` using `NewsletterForm` primitive
- [x] T058 [P] [US3] Create shared `Testimonials` section component in `components/storefront/sections/Testimonials.tsx` using `TestimonialCard` primitive
- [x] T059 [US3] Update `BrandStory.tsx` in `components/storefront/sections/BrandStory.tsx` to accept `BrandStoryContent` props (rename from `AboutContent`)

### Template Registration

- [x] T060 [US3] Register elegance section components in `templates/elegance/index.ts` — export `sections` record with HeroSection, CategoryShowcase, FeaturedProducts, PromoBanner, FooterSection
- [x] T061 [US3] Update `EleganceHomePage.tsx` to pass template module to the refactored `SectionRenderer` instead of raw sections

**Checkpoint**: Storefront renders all sections with elegance template styling. Per-template sections use custom components. Shared sections use defaults with template-scoped CSS.

---

## Phase 6: User Story 4 - System Migration (Priority: P2)

**Goal**: Database migration scripts update section keys, template references, and seed new sections

**Independent Test**: Run migrations, verify DB state matches new schema (no old section keys, correct template slug)

### Implementation for User Story 4

- [x] T062 [US4] Create Drizzle migration to rename `about` → `brand_story` in `storefront_sections.section_key`
- [x] T063 [P] [US4] Create Drizzle migration to rename `product_grid_featured` → `featured_products` and delete `product_grid_new_arrivals`/`product_grid_exclusive` rows in `storefront_sections`
- [x] T064 [P] [US4] Create Drizzle migration to update `merchants.template` default to `'elegance'` and update existing rows
- [x] T065 [P] [US4] Create Drizzle migration to update `store_templates` — delete general/retail rows, rename fashion → elegance
- [x] T066 [US4] Create Drizzle migration to seed `promo_banner`, `testimonials`, `newsletter` sections (hidden) for existing merchants missing them

**Checkpoint**: Database fully migrated. No legacy section keys or template references remain.

---

## Phase 7: User Story 5 - Dashboard Removes Drag-and-Drop (Priority: P2)

**Goal**: Dashboard templates page has no reorder functionality, sections in fixed order

**Independent Test**: Open `/dashboard/templates`, verify no drag handles, sections in catalog order

> Note: Most of this work is already done in Phase 3 (US1) — tasks T036 and T037 delete DraggableSectionItem and remove @dnd-kit. This phase covers any remaining cleanup.

### Implementation for User Story 5

- [x] T067 [US5] Verify `@dnd-kit/sortable` and `@dnd-kit/core` are not imported anywhere else in the project; if not, remove from `package.json` dependencies
- [x] T068 [US5] Update `TemplatesPageClient.tsx` to ensure section list items are plain, non-draggable accordion items using the catalog's fixed order

**Checkpoint**: No drag-and-drop anywhere in dashboard. Clean section list with fixed order.

---

## Phase 8: User Story 6 - Content Customization Is Text+Images Only (Priority: P2)

**Goal**: All section editors expose only text/image fields — no layout selectors or style overrides

**Independent Test**: Open each of the 10 section editors, verify only text/image controls present

> Note: Most of this work is already done in Phase 2 (T024 strips schema fields) and Phase 3 (T035 strips editor UI). This phase covers verification and edge cases.

### Implementation for User Story 6

- [x] T069 [US6] Audit all 10 section editor forms in `SectionEditors.tsx` — verify no layout dropdown, color picker, opacity slider, or column count control exists
- [x] T070 [US6] Verify `featuredProducts` editor shows `gridType` selector (data source = content, kept) but no grid column count or layout style options
- [x] T071 [US6] Remove any stale CSS or conditional logic referencing removed fields (`overlayOpacity`, `layout`, `backgroundColor`, `textColor`) across all storefront components

**Checkpoint**: Every section editor is strictly text+images. No design knobs accessible to merchants.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, documentation, and validation across all stories

- [x] T072 [P] Update storefront design documentation in `designmd/` — remove DESIGN-general.md references, update DESIGN-fashion.md → DESIGN-elegance.md
- [x] T073 [P] Clean up deprecated shared section components: add deprecation comments to `FullBleedHero.tsx`, `CategoryMosaic.tsx`, `DynamicProductGrid.tsx` or delete if no longer imported
- [x] T074 Update `app/(dashboard)/dashboard/templates/page.tsx` server component to handle single-template scenario gracefully
- [x] T075 [P] Update admin templates management page `app/(admin)/admin/templates/TemplatesDashboardClient.tsx` to reflect elegance as the only template
- [x] T076 Run all quickstart validation scenarios (V1–V9 from quickstart.md) and fix any failures
- [x] T077 Verify storefront renders correctly with all sections visible, with some hidden, and with only core sections visible

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — dashboard editor
- **US2 (Phase 4)**: Depends on Phase 2 + partially on Phase 3 (toggle UI lives in same component)
- **US3 (Phase 5)**: Depends on Phase 2 — storefront rendering (independent of dashboard work)
- **US4 (Phase 6)**: Depends on Phase 2 — DB migrations (independent of UI work)
- **US5 (Phase 7)**: Depends on Phase 3 — cleanup after drag-and-drop removal
- **US6 (Phase 8)**: Depends on Phase 3 — verification after editor refactor
- **Polish (Phase 9)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2. No dependencies on other stories.
- **US2 (P1)**: Can start after Phase 2. Toggle UI integrates into same TemplatesPageClient — mild dependency on US1 component structure.
- **US3 (P1)**: Can start after Phase 2. Fully independent of dashboard work (US1/US2).
- **US4 (P2)**: Can start after Phase 2. Fully independent — DB migrations only.
- **US5 (P2)**: Depends on US1 (T036/T037 already remove drag-and-drop).
- **US6 (P2)**: Depends on US1 (T035 already strips editor fields).

### Parallel Opportunities

```
After Phase 2 completes:

  ┌── US1 (Dashboard editor) ──┐
  │                             ├── US5 (Drag cleanup)
  │                             └── US6 (Content audit)
  │
  ├── US3 (Storefront rendering) ── independent
  │
  └── US4 (DB migrations) ────────── independent
```

US1, US3, and US4 can all proceed in parallel after Phase 2.

---

## Implementation Strategy

### MVP First (User Stories 1 + 3)

1. Complete Phase 1: Setup (delete old templates, rename)
2. Complete Phase 2: Foundational (types, schemas, catalog, renderer)
3. Complete Phase 3: US1 — Dashboard editor works with new sections
4. Complete Phase 5: US3 — Storefront renders with elegance template
5. **STOP and VALIDATE**: Both dashboard and storefront work end-to-end
6. Continue with US2, US4, US5, US6

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. US1 → Dashboard editable → Demo
3. US3 → Storefront rendering → Demo
4. US2 → Toggle sections → Demo
5. US4 → DB migrations → Deploy-ready
6. US5 + US6 → Cleanup → Production-ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD per constitution)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The `@dnd-kit` removal spans US1 (T036/T037) and US5 (T067) — most work happens in US1
- Editor field stripping spans Phase 2 (T024 schemas) and US1 (T035 UI) and US6 (T069-T071 audit)
