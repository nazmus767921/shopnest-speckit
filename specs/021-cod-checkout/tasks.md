# Tasks: Cash on Delivery (COD) Checkout Integration

**Input**: Design documents from `/specs/021-cod-checkout/`

**Prerequisites**: [plan.md](file:///C:/Users/Admin/Desktop/Projects/running/shopnest-speckit/specs/021-cod-checkout/plan.md) (required), [spec.md](file:///C:/Users/Admin/Desktop/Projects/running/shopnest-speckit/specs/021-cod-checkout/spec.md) (required for user stories), [data-model.md](file:///C:/Users/Admin/Desktop/Projects/running/shopnest-speckit/specs/021-cod-checkout/data-model.md)

**Tests**: Test-Driven Development (TDD) tasks are included per the non-negotiable Test-First principle in the [ShopNest Constitution](file:///C:/Users/Admin/Desktop/Projects/running/shopnest-speckit/.specify/memory/constitution.md).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Verify database migration environment and setup feature branch dependencies in package.json
- [X] T002 Configure Vitest test suite settings in vitest.config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Update Drizzle schema extensions for merchants (adding codEnabled, payDeliveryChargeFirst, bkashWalletNumber, nagadWalletNumber), orders, and payment confirmations in db/schema.ts
- [X] T004 Create Drizzle migration file and apply it to target Postgres database
- [X] T005 [P] Ensure settings page app/(dashboard)/dashboard/settings/page.tsx and storefront checkout page app/(storefront)/[subdomain]/checkout/page.tsx call await connection() and are wrapped in <Suspense> boundaries
- [X] T006 [P] Implement validation schema updates for store settings (including optional bkash/nagad wallet numbers) in lib/validations/settings.ts
- [X] T007 [P] Implement validation schema updates for checkout payment method in lib/validations/checkout.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Enabling Cash on Delivery & Advance Payment Options (Priority: P1) 🎯 MVP

**Goal**: Allow merchants to toggle Cash on Delivery and require upfront delivery charge payment in Store Settings (if their subscription plan supports it).

**Independent Test**: Log into the merchant dashboard, navigate to Store Settings > Payments, toggle "Cash on Delivery" to enable, see "Pay Delivery Charge First" sub-toggle, enable it, save settings, and reload to verify fields are persisted. If plan doesn't support COD, verify toggle is disabled.

### Tests for User Story 1 (TDD - Write first and verify they fail)

- [X] T008 [P] [US1] Write unit tests for merchant store settings validation and plan capability check in __tests__/cod-checkout.test.ts
- [X] T009 [P] [US1] Write integration tests for settings DB query function `updateStoreSettings` in __tests__/cod-checkout.test.ts

### Implementation for User Story 1

- [X] T010 [US1] Implement `updateStoreSettings` database query function in db/queries/merchants.ts
- [X] T011 [US1] Implement server action `updateStoreSettingsAction` in app/actions/settings.ts with plan-gating checks
- [X] T012 [US1] Implement toggle UI, sub-toggle visibility, and wallet number inputs in app/(dashboard)/dashboard/settings/components/StoreSettingsForm.tsx using design system tokens

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Checking Out with Cash on Delivery (Priority: P1)

**Goal**: Allow customers to select Cash on Delivery (standard or with upfront delivery charge) during storefront checkout.

**Independent Test**: Customer goes to storefront checkout. Case 1 (Standard COD): customer selects COD, sees note "Pay in cash when your order arrives" without Transaction ID input, submits order. Case 2 (Pay Delivery Charge First): customer selects COD, sees bKash/Nagad info and required Transaction ID input, enters a transaction ID, and submits. Verify orders are created in `processing` (Standard) or `pending_payment` (Upfront).

### Tests for User Story 2 (TDD)

- [ ] T013 [P] [US2] Write unit tests for checkout payment validation schema in __tests__/cod-checkout.test.ts
- [ ] T014 [P] [US2] Write integration tests for checkout order creation action in __tests__/cod-checkout.test.ts

### Implementation for User Story 2

- [ ] T015 [US2] Update checkout client UI to dynamically render standard COD note or upfront payment instructions (with wallet numbers) and transaction ID input based on merchant settings in components/storefront/CheckoutClientPage.tsx
- [ ] T016 [US2] Implement checkout submission order creation logic and stock-level validation in app/(storefront)/[subdomain]/checkout/actions.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Managing COD and Returned Orders (Priority: P2)

**Goal**: Allow merchants to identify COD orders, confirm upfront payments, mark orders as delivered (auto-pay), and handle doorstep rejections/returns (auto-restock).

**Independent Test**: In dashboard, view orders list, verify COD orders display "COD" badge. View a `pending_payment` COD order, click "Confirm Payment", status transitions to `processing`. Mark a COD order as `delivered` and verify payment is marked fully paid. Mark a COD order as `returned` and verify stock count of all items increases.

### Tests for User Story 3 (TDD)

- [ ] T017 [P] [US3] Write integration tests for order payment confirmation, auto-paid on delivery, and stock restoration on returned status in __tests__/cod-checkout.test.ts

### Implementation for User Story 3

- [ ] T018 [US3] Implement order queries `confirmPayment`, `updateOrderStatus`, and `restoreStockCount` with safe transaction stock guards in db/queries/orders.ts
- [ ] T019 [US3] Implement "COD" badge UI in dashboard order lists and detail views in app/(dashboard)/dashboard/orders/components/StatusBadge.tsx
- [ ] T020 [US3] Implement "Confirm Payment" button and status transition controls in app/(dashboard)/dashboard/orders/components/OrderActions.tsx

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T021 [P] Implement performance check for order return stock restoration latency in __tests__/cod-checkout.test.ts
- [ ] T022 Clean up unused Drizzle imports and run linter and TypeScript compiler checks across the app
- [ ] T023 Document COD payment workflow setup guidelines in docs/cod-integration.md
- [ ] T024 Run validation scenarios in specs/021-cod-checkout/quickstart.md to verify end-to-end flow correctness

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User stories can then proceed in parallel (if staffed).
  - Or sequentially in priority order (P1 → P2).
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable.
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable.

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation.
- Models before services.
- Services before endpoints.
- Core implementation before integration.
- Story complete before moving to next priority.

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel.
- All Foundational tasks marked [P] can run in parallel (within Phase 2).
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows).
- All tests for a user story marked [P] can run in parallel.
- Different user stories can be worked on in parallel by different team members.

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Write unit tests for merchant store settings validation and plan capability check in __tests__/cod-checkout.test.ts"
Task: "Write integration tests for settings DB query function updateStoreSettings in __tests__/cod-checkout.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 & User Story 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. Complete Phase 4: User Story 2
5. **STOP and VALIDATE**: Test User Stories 1 & 2 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo
3. Add User Story 2 → Test independently → Deploy/Demo (Storefront checkout complete!)
4. Add User Story 3 → Test independently → Deploy/Demo (Merchant order management complete!)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 & 2
   - Developer B: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
