# Tasks: Storefront Architecture Refactor

**Input**: Design documents from `/specs/005-storefront-architecture-refactor/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Exact file paths are included in descriptions.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for the new domain

- [x] T001 Create `lib/storefront/` domain directory structure
- [x] T002 [P] Create `components/storefront/pages/` and `components/storefront/primitives/` directories
- [x] T003 [P] Move existing shared storefront components into the new taxonomy (`primitives/`, `shared/`, `pages/`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Define Zod schemas and `StorefrontSection` discriminated union in `lib/storefront/schema/sections.ts`
- [x] T005 Define `StorefrontContext` and `TemplateModule` interfaces in `templates/types.ts`
- [x] T006 Implement `defineTemplate()` builder in `templates/registry.ts`
- [x] T006b Implement `createDefaultSection(key)` helper in `templates/registry.ts`
- [x] T007 Implement `formatProduct()` utility in `lib/storefront/data/formatters.ts`
- [x] T008 Implement `getStorefrontContext()` DAL in `lib/storefront/data/context.ts` (with `use cache` and `cacheTag`)
- [x] T009 Migrate theme logic (tokens, fonts) to `lib/storefront/theme/`
- [x] T010 Create `templates/__tests__/template-contract.test.ts` to validate registered templates

**Checkpoint**: Foundation ready - Core domain logic and strict contracts are in place.

---

## Phase 3: User Story 2 - Storefront Renders Correctly with Refactored Architecture (Priority: P1)

**Goal**: Refactor the existing Elegance template to use the new typed sections, Shell pattern, and `defineTemplate` builder.

**Independent Test**: The Elegance template compiles without `as any` casts and passes the new `template-contract.test.ts`.

### Implementation for User Story 2

- [x] T011 [US2] Create `EleganceShell.tsx` in `templates/elegance/Shell.tsx` to wrap pages with Navbar and Footer
- [x] T012 [P] [US2] Refactor all 10 Elegance section components to use the strict discriminated union types (remove `as any`)
- [x] T013 [P] [US2] Update `ElegancePLP.tsx`, `ElegancePDP.tsx`, and `EleganceHome.tsx` to match the new `TemplateModule.pages` signatures
- [x] T014 [US2] Register the elegance template using `defineTemplate()` in `templates/elegance/index.ts`
- [x] T015 [US2] Create `DESIGN.md` for the elegance template in `templates/elegance/DESIGN.md`
- [x] T016 [US2] Ensure `storefront-tokens.css` is separated from `templates/elegance/styles.css`

**Checkpoint**: The Elegance template is fully modernized to the new architecture.

---

## Phase 4: User Story 3 - Route Pages Are Thin Orchestrators (Priority: P2)

**Goal**: Refactor the Next.js routes to use the DAL and delegate rendering to the template.

**Independent Test**: Visiting the storefront locally renders the elegance template identically to before, but via the new thin routes.

### Implementation for User Story 3

- [x] T017 [US3] Refactor `app/(storefront)/[subdomain]/layout.tsx` to read `headers()`/`cookies()`, wrap children in `<Suspense>`, fetch DAL context, dynamically load CSS, and wrap children in `template.Shell`
- [x] T018 [P] [US3] Refactor `app/(storefront)/[subdomain]/page.tsx` to use the DAL and delegate to `template.pages.home`
- [x] T019 [P] [US3] Refactor `app/(storefront)/[subdomain]/products/page.tsx` to use the DAL and delegate to `template.pages.plp`
- [x] T020 [P] [US3] Refactor `app/(storefront)/[subdomain]/product/[slug]/page.tsx` to use the DAL and delegate to `template.pages.pdp`
- [x] T021 [US3] Move Cart and Checkout pages to `components/storefront/pages/` and refactor their respective route pages to be thin orchestrators

**Checkpoint**: All routing is now cleanly separated from template rendering logic.

---

## Phase 5: User Story 1 - Developer Creates a New Template (Priority: P1)

**Goal**: Provide a scaffold script to generate new templates rapidly.

**Independent Test**: Running `bun run scaffold:template midnight` generates a working template that passes the contract test.

### Implementation for User Story 1

- [x] T022 [US1] Create the scaffold script in `scripts/scaffold-template.ts`
- [x] T023 [US1] Ensure the scaffold script generates `index.ts`, `Shell.tsx`, 4 page stubs, 10 section stubs, `styles.css`, and `DESIGN.md`
- [x] T024 [US1] Ensure the scaffold script generates `__tests__/` with basic smoke tests

**Checkpoint**: Developers can now quickly create new templates without boilerplate copy-pasting.

---

## Phase 6: User Story 4 - Error Resilience (Priority: P2)

**Goal**: Ensure a single failing section doesn't crash the storefront, and provide themed error pages.

**Independent Test**: Forcing a crash in a section only shows a localized error fallback.

### Implementation for User Story 4

- [x] T022 [US3] Delete `app/(dashboard)/[organizationId]/[storeId]/templates/retail/`
- [x] T023 [US3] Delete `app/(dashboard)/[organizationId]/[storeId]/templates/general/`
- [x] T024 [P] [US4] Move `components/storefront/sections/HeroSection.tsx` and others to `components/storefront/shared/` only if they are truly shared, else delete them
- [x] T025 [P] [US4] Create `SectionErrorBoundary.tsx` in `components/storefront/shared/` and wrap each section in `SectionRenderer.tsx`
- [x] T026 [P] [US4] Create `app/(storefront)/[subdomain]/error.tsx` to provide a global storefront error boundary

**Checkpoint**: Storefront is resilient to component-level rendering errors.

---

## Phase 7: User Story 5 - Template Preview Mode (Priority: P3)

**Goal**: Allow merchants to preview templates securely via query params.

**Independent Test**: Visiting `?template_preview=midnight` shows the midnight template with a preview banner.

### Implementation for User Story 5

- [x] T026b [US5] Update `middleware.ts` to intercept `?template_preview=<slug>`, validate owner session, and set `x-template-preview` header
- [x] T027 [US5] Update `getStorefrontContext` in `lib/storefront/data/context.ts` to read the `x-template-preview` header from `layout.tsx` (passed as primitive)
- [x] T028 [US5] Add a "Preview Mode" banner to the storefront `layout.tsx` or `Shell.tsx` when `isPreview` is true

**Checkpoint**: Merchants can safely preview templates before activating them.

---

## Phase 8: User Story 6 - Agent-Ready Template Workflow (Priority: P2)

**Goal**: Document the architecture explicitly so AI agents can reliably build templates.

**Independent Test**: An agent can read `TEMPLATE_AUTHORING.md` and understand all constraints.

### Implementation for User Story 6

- [x] T029 [US6] Write `templates/TEMPLATE_AUTHORING.md` containing the contract, rules, and shared component catalog
- [x] T030 [US6] Create `.agents/skills/storefront-template/SKILL.md` encoding the full AI generation workflow

**Checkpoint**: The architecture is fully documented and ready for agent-driven expansion.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T031 Run quickstart.md validation to ensure the scaffold script and preview mode function exactly as documented
- [x] T032 Clean up any unused legacy types or route-level helper functions replaced by the DAL
- [x] T033 Implement fallback logging warning in template registry when falling back to default template

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **US2: Elegance Migration (Phase 3)**: Depends on Foundational. MUST happen before US3.
- **US3: Route Pages (Phase 4)**: Depends on US2 (routes need a working template to render).
- **US1: Scaffold Tooling (Phase 5)**: Depends on Foundational (needs `defineTemplate` to exist).
- **US4: Error Resilience (Phase 6)**: Depends on US3.
- **US5: Template Preview (Phase 7)**: Depends on US3.
- **US6: Agent Workflow (Phase 8)**: Depends on US1 (needs the scaffold script to be complete).
- **Polish (Phase 9)**: Depends on all user stories being complete.

### Parallel Opportunities

- All Foundational schema and interface tasks (T004-T006) can happen alongside DAL implementation (T007-T008).
- The Elegance section migrations (T012) can be aggressively parallelized since they are independent components.
- The route page refactors (T018-T020) can be done in parallel once the layout is ready.
- Documentation tasks (T029, T030) can be done in parallel with testing.
