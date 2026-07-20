# Tasks: Retail Storefront Template & Flash Sales

**Input**: Design documents from `/specs/003-retail-storefront-template/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: TDD approach is required. Failing tests must be written first and verify failure before implementing code changes.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure.

- [x] T001 Initialize template structure and folders under templates/retail/
- [x] T002 Configure tailwind or global registry links for the retail template

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Setup database schema migrations for category image and flash sales tables in db/schema.ts
- [x] T004 Create database migration SQL script in db/migrations/0035_add_category_image_and_flash_sales.sql
- [x] T005 [P] Register template identifier keys and extend types in templates/registry.ts and templates/types.ts
- [x] T006 [P] Register required icons (like Zap, Bell, User, etc.) in lib/icons.ts

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Managing Flash Sales in Admin Dashboard (Priority: P1) 🎯 MVP

**Goal**: Allow merchants to create, edit, list, and disable flash sales on their products from the dashboard.

**Independent Test**: Create a flash sale for a product via the dashboard form, save it, and verify it appears on the sales list.

### Tests for User Story 1
- [x] T007 [P] [US1] Write failing test cases for flash sale dashboard actions and validation in __tests__/flash-sales-admin.test.ts

### Implementation for User Story 1
- [x] T008 [P] [US1] Create Zod validators for flash sale creating/editing payload in lib/validations/flash-sales.ts
- [x] T009 [P] [US1] Implement database helper queries for flash sales CRUD in db/queries/flash-sales.ts
- [x] T010 [US1] Create flash sale server actions in app/actions/flash-sales.ts
- [x] T011 [P] [US1] Implement dashboard route page for flash sales listing in app/(dashboard)/dashboard/flash-sales/page.tsx
- [x] T012 [US1] Create flash sale dashboard client list in app/(dashboard)/dashboard/flash-sales/components/FlashSalesClient.tsx
- [x] T013 [US1] Create flash sale edit modal in app/(dashboard)/dashboard/flash-sales/components/FlashSaleModal.tsx

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Shopping Flash Sales with Real-Time Stock & Countdown (Priority: P1)

**Goal**: Enable shoppers to buy flash sale items at the discount price, locking inventory during order creation.

**Independent Test**: Complete checkout with an active flash sale item, verifying that the price is snapshotted, stock is decremented, and the flash sale sold count increments.

### Tests for User Story 2
- [x] T014 [P] [US2] Write failing integration tests for flash sale checkout price checks in __tests__/flash-sales-checkout.test.ts

### Implementation for User Story 2
- [x] T015 [US2] Implement active flash sale caching layer in lib/cache/flash-sales.ts
- [x] T016 [US2] Update order creation query transactional locks and limit checks in db/queries/orders.ts

**Checkpoint**: User Stories 1 and 2 are functional and testable.

---

## Phase 5: User Story 3 - Configuring Category Images in Admin (Priority: P2)

**Goal**: Allow merchants to configure a square image/icon for product categories.

**Independent Test**: Upload a square image for a category in the Category Manager modal, save it, and verify it updates the category record.

### Tests for User Story 3
- [x] T017 [P] [US3] Write failing integration tests for category image updates in __tests__/category-images.test.ts

### Implementation for User Story 3
- [x] T018 [US3] Update database query for category CRUD to fetch and update image_url in db/queries/categories.ts
- [x] T019 [US3] Update category server action logic to support category image payload in app/actions/categories.ts
- [x] T020 [US3] Integrate category image input in the Category Modal UI in app/(dashboard)/dashboard/categories/components/CategoryModal.tsx

**Checkpoint**: Category image uploading is functional.

---

## Phase 6: User Story 4 - The visual "Retail" Storefront Template (Priority: P1)

**Goal**: Build a visual, 1:1 pixel-perfect storefront layout showcasing categories, heroes, and flash sales.

**Independent Test**: Apply the `retail` template to a store, load the homepage, and visually inspect that headers, alignments, counting-down cards, progress bars, grids, and footers align 1:1 with the mockup layout.

### Tests for User Story 4
- [x] T021 [P] [US4] Write failing rendering tests for the retail storefront page layout in __tests__/retail-storefront.test.tsx

### Implementation for User Story 4
- [x] T022 [P] [US4] Create stylesheet for retail template visual styling in templates/retail/styles.css
- [x] T023 [P] [US4] Implement storefront navbar with SVG logo, search, and category dropdowns in templates/retail/RetailNavbar.tsx
- [x] T024 [P] [US4] Implement retail storefront footer columns in templates/retail/RetailFooter.tsx
- [x] T025 [US4] Implement storefront product card component with rating stars and wishlist heart in templates/retail/components/RetailProductCard.tsx
- [x] T026 [US4] Implement active countdown timer leaf component with stock progress indicators in templates/retail/components/RetailFlashSaleCard.tsx
- [x] T027 [US4] Implement storefront home layout featuring category scroll bar, hero banner, flash sales, and product grids in templates/retail/RetailHomePage.tsx
- [x] T028 [P] [US4] Implement retail PLP grid catalog layout in templates/retail/RetailPLP.tsx
- [x] T029 [P] [US4] Implement retail PDP detail view page in templates/retail/RetailPDP.tsx
- [x] T030 [P] [US4] Implement retail cart list display in templates/retail/RetailCartPage.tsx
- [x] T031 [P] [US4] Implement retail generic CMS standard page in templates/retail/RetailStandardPage.tsx
- [x] T032 [P] [US4] Implement template routing index exports in templates/retail/index.ts
- [x] T033 [US4] Import retail stylesheet into main storefront layout in app/(storefront)/[subdomain]/layout.tsx

**Checkpoint**: Storefront templates display and layout works perfectly.
 
---
 
## Phase 6.5: User Story 5 - Bulk Launching Flash Sales (Priority: P2)
 
**Goal**: Enable merchants to bulk configure and launch campaigns from a searchable product list workspace table.
 
**Independent Test**: Bulk create campaigns on 3 products, verify atomic success.
 
### Tests for User Story 5
- [x] T034 [P] [US5] Write failing integration tests for bulk campaign launching transactions in __tests__/flash-sales-bulk.test.ts
 
### Implementation for User Story 5
- [x] T035 [P] [US5] Implement bulkCreateFlashSalesAction Server Action with transaction rollback guards in app/actions/flash-sales.ts
- [x] T036 [US5] Add Bulk Launch button link inside the main listing header in app/(dashboard)/dashboard/flash-sales/components/FlashSalesClient.tsx
- [x] T037 [P] [US5] Create server-side router page for bulk workspace under app/(dashboard)/dashboard/flash-sales/bulk/page.tsx
- [x] T038 [US5] Create BulkFlashSalesClient workspace with multi-select combobox and global pre-calculator in app/(dashboard)/dashboard/flash-sales/bulk/components/BulkFlashSalesClient.tsx
 
**Checkpoint**: Bulk launching features are functional and fully verified.
 
---
 
## Phase 7: Polish & Cross-Cutting Concerns
 
**Purpose**: Refactoring, styling polish, and final verification.
 
- [x] T039 Run lint checks and resolve any compilation or typescript errors across templates
- [x] T040 Execute the end-to-end verification quickstart scenario instructions in specs/003-retail-storefront-template/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all subsequent user stories.
- **User Stories (Phases 3 to 6)**: All depend on Foundational phase completion.
- **Polish (Phase 7)**: Depends on all user story phases completion.

### Parallel Opportunities
- Setup tasks can run in parallel.
- Foundational registration/icon tasks can run in parallel.
- Test files can be created in parallel.
- Once Foundation completes, User Stories can be developed concurrently:
  - Developer A: User Story 1 (Admin Flash Sales CRUD)
  - Developer B: User Story 3 (Category Image uploads)
  - Developer C: User Story 4 (Storefront Template static elements)

---

## Parallel Example: User Story 1

```bash
# Launch models and test setups together
Task: "Write failing test cases for flash sale dashboard actions and validation in __tests__/flash-sales-admin.test.ts"
Task: "Create Zod validators for flash sale creating/editing payload in lib/validations/flash-sales.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)
1. Complete Setup and Foundational database migrations.
2. Complete User Story 1 (Admin Dashboard CRUD).
3. Complete User Story 2 (Checkout transaction validations).
4. Run integration checks to confirm order placing under promotional discounts works.

### Incremental Delivery
1. Foundation database setup.
2. Flash Sales backend + transactional locks (US1 + US2).
3. Category Image upload support (US3).
4. Storefront template visual components & countdowns (US4).
5. Code cleanup and validation.
