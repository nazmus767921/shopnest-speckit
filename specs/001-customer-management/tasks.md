# Tasks: Storefront Customer Portal & Admin Management

**Input**: Design documents from `/specs/001-customer-management/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are included as TDD is mandatory per project guidelines (AGENTS.md).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create baseline schema models structure per data-model.md in db/schema.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database tables, queries, and middleware routing that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Update database schema to add `merchantId` to `user` table, remove email-level unique constraint, and add composite/conditional unique index in db/schema.ts
- [x] T003 Generate and execute schema migration scripts using drizzle-kit in db/schema.ts
- [x] T004 Create database tables for `customerAddresses` and `bannedIps` in db/schema.ts
- [x] T005 Create database queries module for customers directory list, address management, and IP blocklist lookup in db/queries/customers.ts
- [x] T006 [P] Write Vitest unit and query integration tests for new database operations in db/queries/__tests__/customers.test.ts
- [x] T007 Integrate middleware-level client IP check and database-backed block list verify inside proxy.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Storefront Customer Registration & Authentication (Priority: P1)

**Goal**: Provide register and login flows scoped to the storefront subdomain.

**Independent Test**: Visitor registers at subdomain register page, session is established, and they can login on the subdomain login page.

### Tests for User Story 1
- [x] T008 [P] [US1] Write Vitest unit tests for storefront registration and login views in app/(storefront)/[subdomain]/__tests__/auth.test.tsx

### Implementation for User Story 1
- [x] T009 [US1] Configure Better Auth schema settings to support suffix-based email (`email:merchantId`) login lookup in lib/auth/auth.ts
- [x] T010 [US1] Implement storefront customer registration page and submission form in app/(storefront)/[subdomain]/register/page.tsx
- [x] T011 [US1] Implement storefront customer sign-in page and submission form in app/(storefront)/[subdomain]/login/page.tsx

**Checkpoint**: Storefront customer authentication is fully functional and testable.

---

## Phase 4: User Story 2 - Customer Portal Dashboard (Profile, Addresses, & Orders) (Priority: P1)

**Goal**: Implement profile view, address management book, and historical orders list for storefront customers.

**Independent Test**: Logged-in customer can view profile dashboard, add/edit addresses, and list past orders.

### Tests for User Story 2
- [x] T012 [P] [US2] Write Vitest tests for customer profile dashboard and address book components in app/(storefront)/[subdomain]/profile/__tests__/profile.test.tsx

### Implementation for User Story 2
- [x] T013 [US2] Implement customer dashboard layout and basic profile information view in app/(storefront)/[subdomain]/profile/page.tsx
- [x] T014 [US2] Implement customer shipping address book add/edit/delete form views in app/(storefront)/[subdomain]/profile/addresses.tsx
- [x] T015 [US2] Implement storefront customer orders listing page in app/(storefront)/[subdomain]/orders/page.tsx

**Checkpoint**: Customer portal features are fully operational.

---

## Phase 5: User Story 3 - Merchant Admin Customer Directory (Priority: P2)

**Goal**: Build a directory listing of registered storefront customers in the merchant dashboard.

**Independent Test**: Merchant admin visits dashboard Customers page, searches/filters, and views lists of customers.

### Tests for User Story 3
- [x] T016 [P] [US3] Write Vitest tests for merchant admin customer directory table view in app/(dashboard)/dashboard/customers/__tests__/directory.test.tsx

### Implementation for User Story 3
- [x] T017 [US3] Implement Customer Directory layout with search bar, pagination, and plan/status filters in app/(dashboard)/dashboard/customers/page.tsx

**Checkpoint**: Admin customer directory is complete.

---

## Phase 6: User Story 4 - Merchant Admin Customer Details & Moderation (Priority: P2)

**Goal**: Implement customer details display and account/IP ban controls in the merchant dashboard.

**Independent Test**: Admin views customer spend metrics/logs, suspends account, and bans client IP address.

### Tests for User Story 4
- [x] T018 [P] [US4] Write Vitest tests for admin customer details view and ban control actions in app/(dashboard)/dashboard/customers/__tests__/moderation.test.tsx

### Implementation for User Story 4
- [x] T019 [US4] Implement individual Customer Details dashboard displaying life spend, order items, and IP log in app/(dashboard)/dashboard/customers/[id]/page.tsx
- [x] T020 [US4] Create customer moderation server actions to toggle account status and blacklist IP addresses in app/actions/customers.ts

**Checkpoint**: Customer moderation controls are fully functional.

---

## Phase 7: User Story 5 - Link Past Guest Orders upon Registration (Priority: P2)

**Goal**: Bind existing guest checkout orders matching the newly registered email or phone number.

**Independent Test**: Register customer with phone number that has past guest orders, and verify that the orders show in their order history.

### Tests for User Story 5
- [x] T021 [P] [US5] Write Vitest query tests for retroactive guest order binding in db/queries/__tests__/order-binding.test.ts

### Implementation for User Story 5
- [x] T022 [US5] Implement order binding function during customer registration flow in app/(storefront)/[subdomain]/register/actions.ts
- [x] T025 [US5] Configure Better Auth `phoneNumber` plugin for SMS OTP generation in lib/auth/auth.ts
- [x] T026 [US5] Update storefront customer registration page to support phone number entry and OTP verification step in app/(storefront)/[subdomain]/register/page.tsx
- [x] T027 [US5] Update registration server actions to verify OTP before calling order binding function in app/(storefront)/[subdomain]/register/actions.ts

**Checkpoint**: Guest order binding is complete.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: General improvements and final verification

### Implementation for Polish & Cross-Cutting Concerns
- [x] T023 Implement access blocked message view for banned IP visits in app/blocked/page.tsx
- [x] T024 Run quickstart.md validation scenarios to verify end-to-end flows in specs/001-customer-management/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion. BLOCKS all user stories.
- **User Stories (Phases 3 to 7)**: Depend on Foundational completion.
  - User Story 1 (Authentication) is a prerequisite for User Story 2 (Portal Dashboard).
  - User Stories 3, 4, and 5 can proceed in parallel once authentication foundations are established.
- **Polish (Final Phase)**: Depends on all user stories being complete.

---

## Implementation Strategy

### MVP First (Authentication & Dashboard)
1. Complete Setup + Foundational phases.
2. Complete User Story 1 (Auth) & User Story 2 (Dashboard).
3. Validate storefront login and address books manually.
4. Continue with admin directory and moderation tools.
