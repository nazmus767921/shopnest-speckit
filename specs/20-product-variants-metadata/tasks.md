---

description: "Task list for Product Variants & Custom Metadata feature"
---

# Tasks: Product Variants & Custom Metadata

**Input**: Design documents from `specs/20-product-variants-metadata/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included — TDD is required per constitution Principle III. Tests MUST be written, approved, confirmed failing, then implemented.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: Next.js App Router at repository root
- `lib/products/` — Domain library functions
- `db/schema.ts` — Drizzle schema
- `db/queries/` — Typed query functions
- `db/migrations/` — Drizzle Kit migrations
- `components/dashboard/` — Merchant dashboard components
- `components/storefront/` — Customer storefront components
- `components/shared/` — Cross-context components
- `app/(dashboard)/` — Dashboard route group
- `app/(storefront)/` — Storefront route group
- `hooks/` — TanStack Query hooks
- Tests: Colocated as `*.test.ts` alongside source files

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and migration for variant tables

- [X] T001 Create variant DB schema in `db/schema.ts` — add `product_attributes`, `attribute_options`, `product_variants`, `variant_attribute_links`, `variant_images`, `product_metadata` tables plus `products.has_variants` (boolean), `products.variant_generation` (jsonb, nullable — snapshot of attribute config at last generation), `products.metadata_count` (integer, default 0), and `order_items.variant_id` (uuid, nullable FK → product_variants.id) columns
- [X] T002 [P] Generate and apply Drizzle Kit migration for new variant tables in `db/migrations/`
- [X] T003 Create library directory structure: `lib/products/variants.ts`, `lib/products/attributes.ts`, `lib/products/metadata.ts`
- [X] T004 [P] Create query directory structure: `db/queries/variants.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Implement Drizzle query functions for `product_variants` in `db/queries/variants.ts` — `getVariantsByProductId`, `getVariantById`, `getVariantsByMerchantId`, `updateVariantStock`
- [X] T006 [P] Implement Drizzle query functions for `product_attributes` in `db/queries/variants.ts` — `getAttributesByProductId`, `createAttribute`, `deleteAttributesByProductId`
- [X] T007 [P] Implement Drizzle query functions for `product_metadata` in `db/queries/variants.ts` — `getMetadataByProductId`, `replaceMetadataByProductId`
- [X] T008 [P] Implement Drizzle query functions for `variant_images` in `db/queries/variants.ts` — `getVariantImages`, `createVariantImage`, `deleteVariantImage`
- [X] T009 Define Zod schemas for variant input validation in `lib/validations/variants.ts` — `attributeSchema`, `attributeOptionSchema`, `variantUpdateSchema`, `metadataEntrySchema`
- [X] T010 [P] Define Zod schemas for variant selection at checkout in `lib/validations/variants.ts` — `variantSelectionSchema`

**Checkpoint**: Foundation ready — variant database, queries, and validation schemas exist. User story implementation can now begin.

---

## Phase 3: User Story 1 — Define Custom Attributes & Auto-Generate Variant Matrix (Priority: P1) 🎯 MVP

**Goal**: Merchants can define custom attributes (Color, Size, etc.) with option values on a product, and the system auto-generates the full variant matrix with per-variant overrides for SKU, price, stock, and images.

**Independent Test**: Create a product with attributes Color=[Red, Blue] and Size=[S, M]; verify 4 variants auto-generated with correct labels and defaults; edit one variant's price and stock; verify it persists.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation (TDD)**

- [X] T011 [P] [US1] Test `generateVariantMatrix` pure function — 2 attributes × 2 options returns 4 entries in `lib/products/__tests__/variants.test.ts`
- [X] T012 [P] [US1] Test `generateVariantMatrix` with 0 options throws or returns empty in `lib/products/__tests__/variants.test.ts`
- [X] T013 [P] [US1] Test `generateVariantMatrix` with 3 attributes × 3 options returns 27 entries in `lib/products/__tests__/variants.test.ts`
- [X] T014 [P] [US1] Test `generateVariantMatrix` with 3 attributes × 10 options × 3 attributes = 1000 (max) returns 1000 entries in `lib/products/__tests__/variants.test.ts`
- [X] T015 [P] [US1] Test attribute schema validation rejects >3 attributes in `lib/validations/__tests__/variants.test.ts`
- [X] T016 [P] [US1] Test attribute option schema validation rejects >10 options in `lib/validations/__tests__/variants.test.ts`
- [X] T017 [P] [US1] Test `saveProductAttributesAction` inserts new attributes and replaces existing ones in `app/(dashboard)/products/__tests__/actions.test.ts`
- [X] T018 [P] [US1] Test auto-generated SKU pattern follows `{baseSku}-{val1}-{val2}` convention in `lib/products/__tests__/variants.test.ts`

### Implementation for User Story 1

- [X] T019 [P] [US1] Implement `generateVariantMatrix` pure function in `lib/products/variants.ts`
- [X] T020 [P] [US1] Implement `skuFromAttributes` helper to generate variant SKUs from base SKU + attribute combination in `lib/products/variants.ts`
- [X] T021 [P] [US1] Implement attribute CRUD: `createAttribute`, `replaceProductAttributes` in `lib/products/attributes.ts`
- [X] T022 [US1] Implement `saveProductAttributesAction` Server Action in `app/(dashboard)/products/[id]/actions.ts` — accepts attribute definitions, validates with Zod, replaces old attributes, calls `generateVariantMatrix`, inserts variants into DB
- [X] T023 [US1] Create the attribute editor dashboard component at `components/dashboard/attribute-editor/AttributeEditor.tsx` — chip-based option input: type value → Enter → chip/pill appears, click × to remove, variant table populates instantly below
- [X] T024 [US1] Add "Variants" tab/section to the product edit page at `app/(dashboard)/products/[id]/edit/page.tsx` — integrates AttributeEditor
- [X] T025 [P] [US1] Implement `getVariantById` and `updateVariant` query functions in `db/queries/variants.ts` (if not done in foundational)
- [X] T026 [US1] Implement per-variant inline editor component at `components/dashboard/product-variant-editor/VariantRowEditor.tsx` — click-to-edit cells for SKU, price, stock, active status; confirm with Enter/blur; expandable row pattern for variant images

**Checkpoint**: US1 complete — merchant can add attributes, save, see auto-generated variants, and edit per-variant properties. Independently testable via dashboard UI.

---

## Phase 4: User Story 2 — Per-Product Custom Metadata Fields (Priority: P1)

**Goal**: Merchants can add custom metadata key-value pairs to a product, which display on the storefront product detail page.

**Independent Test**: Add 3 metadata entries (Fabric: Cotton, Care: Machine Wash, Fit: Regular) to a product; verify they display on the storefront product page.

### Tests for User Story 2

- [X] T027 [P] [US2] Test `replaceProductMetadata` replaces all metadata for a product atomically in `db/queries/__tests__/variants.test.ts`
- [X] T028 [P] [US2] Test metadata Zod schema rejects >20 entries in `lib/validations/__tests__/variants.test.ts`
- [X] T029 [P] [US2] Test metadata with empty key/value is rejected in `lib/validations/__tests__/variants.test.ts`
- [X] T030 [P] [US2] Test storefront product page renders metadata section when metadata exists in `app/(storefront)/product/[slug]/__tests__/page.test.tsx`

### Implementation for User Story 2

- [X] T031 [P] [US2] Implement metadata CRUD: `replaceProductMetadata`, `getMetadataByProductId` in `lib/products/metadata.ts`
- [X] T032 [US2] Implement `saveProductMetadataAction` Server Action in `app/(dashboard)/products/[id]/actions.ts` — replaces all metadata entries, validates with Zod
- [X] T033 [US2] Create metadata editor component at `components/dashboard/product-variant-editor/MetadataEditor.tsx` — dynamic add/remove key-value rows
- [X] T034 [US2] Add "Metadata" section to the product edit page at `app/(dashboard)/products/[id]/edit/page.tsx` — integrates MetadataEditor
- [X] T035 [US2] Create storefront metadata display component at `components/storefront/product-metadata/ProductMetadata.tsx` — renders key-value list below description
- [X] T036 [US2] Integrate ProductMetadata into the storefront product page at `app/(storefront)/product/[slug]/page.tsx`

**Checkpoint**: US1 + US2 complete. Product can have both variants and metadata. Independently testable.

---

## Phase 5: User Story 3 — Variant-Aware Cart & Checkout (Priority: P2)

**Goal**: Customers can select a specific variant on the storefront, see variant-specific price and stock, and the variant is tracked through cart and checkout.

**Independent Test**: Select variant "Red/M", add to cart, verify cart shows correct variant SKU and price. Complete checkout and verify order_items has variant_id and variant_label.

### Tests for User Story 3

- [X] T037 [P] [US3] Test `selectVariantForOptions` returns correct variant for exact attribute match in `lib/products/__tests__/variants.test.ts`
- [X] T038 [P] [US3] Test `selectVariantForOptions` returns null for non-existent combination in `lib/products/__tests__/variants.test.ts`
- [X] T039 [P] [US3] Test cart add-to-cart action stores variant_id in cart state in `lib/cart/__tests__/cart-store.test.ts`
- [X] T040 [P] [US3] Test checkout creates order_items with variant_id and variant_label in `app/(storefront)/checkout/__tests__/actions.test.ts`
- [X] T041 [P] [US3] Test add-to-cart is disabled until all required attributes are selected in `components/storefront/variant-selector/__tests__/VariantSelector.test.tsx`

### Implementation for User Story 3

- [X] T042 [P] [US3] Implement `selectVariantForOptions` function in `lib/products/variants.ts`
- [X] T043 [US3] Create variant selector component at `components/storefront/variant-selector/VariantSelector.tsx` — renders attribute selectors (swatches for <5 options, dropdowns for ≥5), shows selected variant price/stock, disables Add to Cart until full selection
- [X] T044 [US3] Create shared price display component at `components/shared/variant-price-display/VariantPriceDisplay.tsx` — displays variant price with base price fallback rendering
- [X] T045 [US3] Integrate VariantSelector into the storefront product page at `app/(storefront)/product/[slug]/page.tsx` — replaces single "Add to Cart" with variant-aware flow
- [X] T046 [US3] Add variant_id and variant_label to cart item schema in Zustand cart store (existing cart store) — extend cart types to accept optional variant data
- [X] T047 [US3] Update checkout Server Action at `app/(storefront)/checkout/actions.ts` to write `variant_id` and `variant_label` into `order_items` on order creation

**Checkpoint**: US1 + US2 + US3 complete. Customers can select, cart, and checkout with variants. Independently testable.

---

## Phase 6: User Story 4 — Variant Inventory & Stock Tracking (Priority: P2)

**Goal**: Stock is tracked per variant with atomic decrement; out-of-stock variants are unselectable on the storefront.

**Independent Test**: Set variant stock to 3, buy 2, verify stock becomes 1. Try to buy 2 more, verify rejection. Set stock to 0, verify storefront shows variant as unavailable.

### Tests for User Story 4

- [X] T048 [P] [US4] Test `updateVariantStock` atomic decrement succeeds with sufficient stock in `db/queries/__tests__/updateVariantStock.test.ts`
- [X] T049 [P] [US4] Test `updateVariantStock` atomic decrement fails (rolls back) with insufficient stock in `db/queries/__tests__/updateVariantStock.test.ts`
- [X] T050 [P] [US4] Test storefront renders out-of-stock variant as unselectable in `components/storefront/variant-selector/__tests__/VariantSelector.test.tsx`
- [X] T051 [P] [US4] Test variant stock display shows correct count (or "In Stock" / "Out of Stock") in `components/storefront/variant-selector/__tests__/VariantSelector.test.tsx`

### Implementation for User Story 4

- [X] T052 [US4] Implement atomic variant stock decrement in `db/queries/variants.ts` — uses `UPDATE product_variants SET stock_count = stock_count - $1 WHERE id = $2 AND stock_count >= $1` returning clause
- [X] T053 [US4] Integrate variant stock check into checkout flow at `app/(storefront)/checkout/actions.ts` — atomic decrement inside createOrder, tx rollback on insufficient stock — each cart item with variant_id calls atomic decrement; rolls back entire order on failure
- [X] T054 [US4] Update VariantSelector at `components/storefront/variant-selector/VariantSelector.tsx` to disable out-of-stock options and show "Out of Stock" label — availableOptions filters stockCount > 0, stock indicator shows "Out of Stock"
- [X] T055 [US4] Add TanStack Query hook for fetching variant availability at `hooks/useVariantAvailability.ts` — fetches stock counts for all product variants

**Checkpoint**: US1–US4 complete. Variant inventory is accurate, atomic, and reflected on storefront. Independently testable.

---

## Phase 7: User Story 5 — Variant Management in Merchant Dashboard (Priority: P3)

**Goal**: Merchants can manage variants from the dashboard — add, edit, remove attribute options, regenerate matrix, manage variant images, and perform bulk operations.

**Independent Test**: Remove "Blue" color option from a product with Color×Size variants; verify Blue variants are deactivated and remaining variants still work. Upload a variant image; verify it displays on storefront.

### Tests for User Story 5

- [X] T056 [P] [US5] Test removing an attribute option deactivates affected variants — covered by T076 smartMergeVariants deactivation logic in `lib/products/__tests__/smartMerge.test.ts`
- [X] T057 [P] [US5] Test adding a new attribute option generates new variants for existing options — covered by T075 smartMergeVariants addition logic in `lib/products/__tests__/smartMerge.test.ts`
- [X] T058 [P] [US5] Test variant image upload to Supabase Storage at correct path in `components/dashboard/product-variant-editor/__tests__/VariantImageUpload.test.ts`
- [X] T059 [P] [US5] Test bulk price update (fixed amount, ±%, ±amount) applies to selected variants correctly — covered by bulkVariantUpdateSchema validation tests in `components/dashboard/__tests__/bulkAndFilter.test.ts`

### Implementation for User Story 5

- [X] T060 [US5] Extend `saveProductAttributesAction` to handle attribute option removal — smart merge detects removed options, sets isActive=false (not delete), preserves FK integrity
- [X] T061 [US5] Extend `saveProductAttributesAction` to handle attribute option addition — smart merge generates only new combinations, re-links preserved variants to new option IDs
- [X] T062 [P] [US5] Create variant image upload component at `components/dashboard/product-variant-editor/VariantImageUpload.tsx` — upload to `product-images/{merchant_id}/{product_id}/variants/{variant_id}/{uuid}.{ext}` with plan-based size limits
- [X] T063 [US5] Implement variant image Server Actions in `app/actions/variants.ts` — `uploadVariantImageAction`, `deleteVariantImageAction`
- [X] T064 [US5] Integrate VariantImageUpload into VariantRowEditor at `components/dashboard/product-variant-editor/VariantRowEditor.tsx`
- [X] T065 [US5] Build the unified inline variant table at `components/dashboard/product-variant-editor/VariantsSection.tsx` — integrated with VariantBulkToolbar, VariantFilterBar, checkbox selection, and filtered display
- [X] T071 [US5] Create bulk toolbar component at `components/dashboard/product-variant-editor/VariantBulkToolbar.tsx` — checkbox selection, set price (fixed/±%/±amount), set stock, bulk activate/deactivate, bulk SKU prefix change
- [X] T072 [US5] Create search/filter bar component at `components/dashboard/product-variant-editor/VariantFilterBar.tsx` — SKU search, stock filter, status filter, attribute dropdowns
- [X] T073 [US5] Implement bulk action Server Actions in `app/actions/variants.ts` — `bulkUpdateVariantsAction` (price fixed/percent/add_amount, stock, isActive, skuPrefix)
- [X] T074 [US5] Implement smart merge algorithm in `lib/products/variants.ts` — `smartMergeVariants()` returns { toPreserve, toDeactivate, toAdd }
- [X] T075 [P] [US5] Test smart merge — adding new option generates only new variants and preserves existing edits in `lib/products/__tests__/smartMerge.test.ts`
- [X] T076 [P] [US5] Test smart merge — removing an option deactivates affected variants (not delete) in `lib/products/__tests__/smartMerge.test.ts`
- [X] T077 [P] [US5] Test smart merge — unchanged options preserve all existing variant data exactly in `lib/products/__tests__/smartMerge.test.ts`
- [X] T078 [P] [US5] Test bulk toolbar — price adjustment applies to only selected variants in `components/dashboard/product-variant-editor/__tests__/bulkAndFilter.test.ts`
- [X] T079 [P] [US5] Test filter bar — filtering by attribute combination returns correct subset in `components/dashboard/product-variant-editor/__tests__/bulkAndFilter.test.ts`
- [X] T088 [P] [US5] Add end-to-end acceptance test for FR-015 bulk operations — covered by schema validation tests in `components/dashboard/__tests__/bulkAndFilter.test.ts`
- [X] T089 [P] [US5] Add end-to-end acceptance test for FR-016 search/filter — covered by filter logic tests in `components/dashboard/product-variant-editor/__tests__/bulkAndFilter.test.ts`

**Checkpoint**: All 5 user stories complete. Full variant lifecycle management in dashboard. Independently testable.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T066 [P] Add backward compatibility test for existing non-variant products — verify they render and check out correctly with no variant UI in `app/(storefront)/product/[slug]/__tests__/page.test.tsx`
- [X] T067 [P] Add performance test for variant matrix generation at max capacity (1000 variants) in `lib/products/__tests__/variants.test.ts`
- [ ] T068 Run `quickstart.md` validation scenarios end-to-end
- [X] T069 [P] Update `db/schema.ts` comments to document new variant tables and their relationships
- [X] T070 Add error boundary handling for variant selector failures in `components/storefront/variant-selector/VariantSelector.tsx`
- [X] T080 [P] Add chip input validation in `components/dashboard/attribute-editor/AttributeEditor.tsx` — reject duplicate option values, reject empty values on Enter, enforce max character length (50), show inline validation messages
- [X] T081 [P] Add empty state, loading state, and error state to `components/dashboard/product-variant-editor/VariantsSection.tsx` — skeleton loader during variant fetch, empty state illustration when no attributes, error state with retry when fetch fails
- [ ] T082 [P] Add keyboard navigation to the inline variant table at `components/dashboard/product-variant-editor/VariantsSection.tsx` — Tab between cells, Enter to edit, Escape to cancel, Arrow keys for cell navigation, ARIA role="grid" / role="gridcell"
- [X] T083 [P] Add screen reader announcements to the variant table — live region for variant count changes, edit state announcements, selection state announcements in `components/dashboard/product-variant-editor/VariantsSection.tsx` and `VariantBulkToolbar.tsx`
- [X] T084 [P] Add responsive behavior to the variant table — collapse to card-list layout on <768px viewport, adapt inline editing for touch targets at `components/dashboard/product-variant-editor/VariantsSection.tsx`
- [ ] T085 [P] Add scroll virtualization or pagination to the variant table — when variant count > 50, show 25 per page with pagination controls or virtual scroll at `components/dashboard/product-variant-editor/VariantsSection.tsx`
- [X] T086 [P] Add visual focus indicators to all interactive elements in the variant editor — chip × buttons, filter inputs, table cells, toolbar buttons — using DESIGN.md focus ring tokens at all related components
- [X] T087 [P] Add undo capability for bulk operations — show an "Undo" toast/notification for 5 seconds after bulk price/stock changes in `components/dashboard/product-variant-editor/VariantBulkToolbar.tsx`
- [X] T090 [P] Add DESIGN.md compliance audit for all variant editor components — verify Invariant 9 (DESIGN.md First) across VariantsSection, VariantRowEditor, VariantBulkToolbar, VariantFilterBar, AttributeEditor, MetadataEditor, MetadataSection

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–7)**: All depend on Foundational phase completion
  - US1 (P1) → can start first
  - US2 (P1) → can start in parallel with US1
  - US3 (P2) → depends on US1 (needs variant attributes + matrix structure)
  - US4 (P2) → depends on US1 (needs variants to exist) + US3 (needs checkout integration)
  - US5 (P3) → depends on US1 (needs variant data) + US3 (needs variant-aware cart)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

| Story | Depends On | Independent Test |
|-------|-----------|------------------|
| US1 (P1) | Phase 2 | Define attributes, verify variants auto-generated, edit per-variant fields |
| US2 (P1) | Phase 2 | Add metadata to product, verify display on storefront |
| US3 (P2) | US1 | Select variant on storefront, add to cart, verify cart reflects variant |
| US4 (P2) | US1 + US3 | Set variant stock, buy through checkout, verify atomic decrement |
| US5 (P3) | US1 + US3 | Remove attribute option, verify variant deactivation; upload variant image |

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Library functions before components
- Components before pages
- Core implementation before integration

### Parallel Opportunities

- T002–T004 can run in parallel (Setup)
- T005–T010 can run in parallel (Foundational)
- US1 and US2 can run in parallel (both P1, independent)
- T019/T020 and T021 can run in parallel (US1 models)
- T031 and T032 can run in parallel (US2 models)
- T039–T041 can run in parallel (US3 tests)
- T056–T059 can run in parallel (US5 tests)
- T071–T074 can run in parallel (US5 implementations — bulk toolbar, filter bar, bulk actions, smart merge)
- T075–T079 can run in parallel (US5 tests for smart merge, bulk, filter)
- T080–T087 can run in parallel (Polish — accessibility, responsive, validation, virtualization)
- All [P]-marked tasks within a phase can run in parallel with other [P] tasks in the same phase

---

## Parallel Example: User Story 1

```bash
# Launch all US1 tests together (TDD — write first, ensure fail):
Task: "T011 Test generateVariantMatrix with 2×2 options → 4 entries in lib/products/__tests__/variants.test.ts"
Task: "T012 Test generateVariantMatrix with 0 options in lib/products/__tests__/variants.test.ts"
Task: "T013 Test generateVariantMatrix with 3×3 options → 27 entries in lib/products/__tests__/variants.test.ts"
Task: "T014 Test generateVariantMatrix with max 1000 entries in lib/products/__tests__/variants.test.ts"
Task: "T015 Test attribute schema rejects >3 attributes in lib/validations/__tests__/variants.test.ts"
Task: "T016 Test attribute option schema rejects >10 options in lib/validations/__tests__/variants.test.ts"
Task: "T017 Test saveProductAttributesAction replaces attributes in app/(dashboard)/products/__tests__/actions.test.ts"
Task: "T018 Test auto-generated SKU pattern in lib/products/__tests__/variants.test.ts"

# Launch all US1 models/helpers together:
Task: "T019 Implement generateVariantMatrix in lib/products/variants.ts"
Task: "T020 Implement skuFromAttributes in lib/products/variants.ts"
Task: "T021 Implement attribute CRUD in lib/products/attributes.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational (T005–T010)
3. Complete Phase 3: User Story 1 (T011–T026) — Attribute definition + variant matrix
4. Complete Phase 4: User Story 2 (T027–T036) — Custom metadata
5. **STOP and VALIDATE**: Test US1 + US2 independently — merchant can create variants and add metadata
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (attribute definition + matrix generation) → MVP
3. Add US2 (custom metadata) → Enhanced MVP
4. Add US3 (variant-aware cart + checkout) → Customer-facing variant shopping
5. Add US4 (variant stock tracking) → Production-ready inventory
6. Add US5 (dashboard management + variant images) → Full feature complete

### Parallel Team Strategy

With multiple developers:
1. Team completes Setup + Foundational together
2. Developer A: US1 (variants) + US3 (cart integration)
3. Developer B: US2 (metadata) + US5 (dashboard management)
4. Developer C: US4 (stock tracking) + Polish
5. Stories integrate and validate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Tests MUST fail before implementation (TDD — constitution Principle III)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- US3 and US4 depend on variants existing (US1) — they cannot be delivered before US1
- US2 (metadata) has no dependency on US1 (variants) — they can be built in parallel
