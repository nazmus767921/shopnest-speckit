# Tasks: json-template-engine

**Input**: Design documents from `/specs/006-json-template-engine/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database cleanup and initial Drizzle schema creation for the new engine.

- [x] T001 Remove legacy `storefront_sections` and `store_templates` from `db/schema.ts` and drop related old code in `templates/` and `app/(dashboard)/dashboard/templates/`.
- [x] T002 Create `themes` and `merchant_themes` tables in `db/schema.ts` per the `data-model.md` definitions.
- [x] T003 Generate and apply Drizzle migrations for the new tables.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T004 [P] Create the seed file or script for initial base `themes` (e.g. Elegance) with default `css_variables`.

**Checkpoint**: Foundation ready - database is prepared.

---

## Phase 3: User Story 1 - Theme Selection and Customization (Priority: P1) 🎯 MVP

**Goal**: Merchants need a way to select a base theme and visually customize their storefront using a drag-and-drop interface.

**Independent Test**: Can be fully tested by opening the merchant dashboard, dragging sections into the layout, and verifying the preview updates instantly.

### Implementation for User Story 1

- [x] T005 [P] [US1] Create the Editor route `app/(dashboard)/dashboard/editor/page.tsx` and wrap in `<Suspense>`.
- [x] T006 [P] [US1] Create `Sidebar.tsx` component in `app/(dashboard)/dashboard/editor/components/` for section selection and drag initiation.
- [x] T007 [P] [US1] Create `LivePreviewIframe.tsx` component in `app/(dashboard)/dashboard/editor/components/` that loads the iframe and listens to `postMessage` updates.
- [x] T008 [US1] Combine the pieces into `VisualEditor.tsx` in `app/(dashboard)/dashboard/editor/components/` using HTML5 DnD (or dnd-kit if already installed) for section reordering.
- [x] T009a [US1] Add a handler/query to ensure a default layout row exists in `merchant_themes` for the current merchant (if missing) when they load the editor.
- [x] T009b [US1] Create a Server Action in `app/(dashboard)/dashboard/editor/actions.ts` to persist the JSON `active_layout` to `merchant_themes`. MUST use Zod to validate the JSON schema and MUST fetch `merchant_id` securely from `auth.api.getSession()`.

**Checkpoint**: At this point, the editor exists, can edit a JSON array in state, sync it via iframe postMessage, and save it to the DB.

---

## Phase 4: User Story 2 - Storefront Rendering (Priority: P1)

**Goal**: Shoppers need to see the dynamic storefront exactly as the merchant designed it in the editor.

**Independent Test**: Can be fully tested by navigating to the merchant's subdomain and verifying the layout matches the JSON definition exactly.

### Implementation for User Story 2

- [x] T010 [P] [US2] Update `app/(storefront)/[domain]/layout.tsx` to fetch `merchant_themes` for the domain.
- [x] T011 [P] [US2] Pass the `theme.css_variables` into a `<style>` block in the `<head>` of the storefront layout.
- [x] T012 [P] [US3] Create a robust `SectionRenderer.tsx` component in `components/storefront/` that maps section types (hero, featured_products) to their respective React components.
- [x] T013 [P] [US3] Update `app/(storefront)/[domain]/page.tsx` to read `active_layout` from `merchant_themes`. Replace static section rendering with a `layout.map(section => <SectionRenderer key={section.id} {...section} />)` loop.
- [x] T014 [US3] Implement `postMessage` listener in `app/(storefront)/[domain]/page.tsx` or a Client Component wrapper. If `?preview=true` is in the URL, listen for `UPDATE_LAYOUT` messages from the Visual Editor and override the DB layout with the React state layout.
- [x] T015 [US3] Wrap the components in `components/storefront/primitives/` as the default fallbacks in the generic `SectionRenderer`.

**Checkpoint**: Storefront accurately renders the database-persisted layout and correctly responds to live-preview messages.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T016 Apply granular `'use cache'` directives to the DB fetch inside `app/(storefront)/[subdomain]/page.tsx` and ensure `revalidateTag` is called on save.
- [x] T017 Validate that all editor UI elements correctly use Shadcn UI components.

## Phase 6: Template Selection (User Story 1.1)

**Goal**: Merchants can browse available themes and select one as their base template.

- [x] T018 Create `app/(dashboard)/dashboard/templates/page.tsx` to list all available themes from the `themes` table.
- [x] T019 Create a Server Action in `app/actions/storefront.ts` (or a dedicated file) to update the merchant's `themeId` in `merchant_themes`.
- [x] T020 Build the UI in `/dashboard/templates` to show theme cards (Elegance, Sunset, Midnight) with an "Apply" button.

## Dependencies

- **US1** requires **Setup**
- **US2** requires **Setup** (Can be developed in parallel to US1 but requires the DB schema)
- **Polish** requires **US1 & US2**

## Implementation Strategy

1. Execute Phase 1 and 2 to establish the Drizzle schemas.
2. Develop User Story 1 (Visual Editor) to allow data to be generated and saved.
3. Develop User Story 2 (Storefront Rendering) to consume that saved data and render it.
4. Apply caching and UI polish at the end.
