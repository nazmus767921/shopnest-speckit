# Feature Specification: Storefront Architecture Refactor

**Feature Branch**: `005-storefront-architecture-refactor`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "Refactor the storefront domain to be production-grade, future-proof, extensible, and agent-ready. Introduce a centralized data access layer, strongly-typed template contract with Shell pattern, discriminated union section types with Zod validation, hybrid CSS architecture, comprehensive error boundaries, template scaffold tooling, and AI-agent-ready documentation."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Creates a New Template (Priority: P1)

An AI agent or human developer is asked to create a new storefront template (e.g., "midnight"). They run a scaffold command, receive a complete boilerplate with TODO markers, fill out the design brief, implement template-specific components using shared primitives, and validate the template passes all contract tests.

**Why this priority**: Template extensibility is the primary goal — the entire refactor exists to make adding new templates safe, fast, and error-free.

**Independent Test**: Run `bun run scaffold:template midnight`, verify the complete directory structure is created with all required files (Shell, 4 pages, 10 sections, styles.css, DESIGN.md, tests). Run `bun test templates/midnight` and verify all smoke tests pass with the scaffolded boilerplate.

**Acceptance Scenarios**:

1. **Given** a developer runs the scaffold command with a template slug, **When** the command completes, **Then** the `templates/{slug}/` directory contains: `index.ts` with `defineTemplate()` call, `Shell.tsx`, 4 page components, 10 section components, `styles.css` with scoped root selector, `DESIGN.md` with TODO placeholders, and `__tests__/` with smoke tests.
2. **Given** a scaffolded template with all TODOs replaced with real implementations, **When** the developer runs the contract test suite, **Then** all tests pass confirming the template exports all required components, all 10 sections are declared, metadata is complete, and CSS scoping is correct.
3. **Given** an agent reading `TEMPLATE_AUTHORING.md`, **When** they follow the documented workflow step-by-step, **Then** the resulting template compiles, passes all tests, and renders correctly in the storefront.

---

### User Story 2 - Storefront Renders Correctly with Refactored Architecture (Priority: P1)

A merchant's storefront (homepage, PLP, PDP, cart, checkout) renders correctly after the architecture refactor. The DAL resolves tenant context, the Shell wraps all pages with the correct Navbar/Footer, sections render with typed content, and theme variables apply.

**Why this priority**: The refactor must not break existing functionality — the elegance template must work exactly as before, just with cleaner internals.

**Independent Test**: Visit any existing merchant's storefront and verify all pages load correctly: homepage with all visible sections, PLP with product grid and filters, PDP with product details and variants, cart page, checkout page.

**Acceptance Scenarios**:

1. **Given** a merchant with the elegance template, **When** a customer visits their homepage, **Then** the Shell renders the EleganceNavbar and FooterSection, the SectionRenderer displays all visible sections with correct typed content, and theme variables (colors, fonts, border radius) apply correctly.
2. **Given** a merchant's product listing page, **When** a customer navigates to `/products`, **Then** products are formatted using the DAL's `formatProduct()` utility (not inline mapping), categories load, and the elegance PLP component renders with correct data.
3. **Given** a section component receives its content, **When** the content is passed by the SectionRenderer, **Then** the content is already narrowed to the correct type (e.g., `HeroContent` for `hero` sections) — no `as any` casts exist anywhere in the rendering pipeline.

---

### User Story 3 - Route Pages Are Thin Orchestrators (Priority: P2)

All storefront route pages (`page.tsx` files) are thin orchestrators that call the DAL for data and delegate rendering to template page components. No inline product formatting, no store object construction, no template resolution logic duplicated across routes.

**Why this priority**: Eliminating code duplication improves maintainability and reduces bugs from inconsistent data formatting.

**Independent Test**: Review all storefront route pages and confirm each is under 30 lines of orchestration code (excluding skeleton components), with all data fetching and formatting delegated to the DAL.

**Acceptance Scenarios**:

1. **Given** the homepage route (`page.tsx`), **When** it renders, **Then** it calls `getStorefrontContext()` for tenant data and `getCachedStorefrontSections()` for sections, then delegates to `<templateModule.pages.home>` — no inline store construction or section defaulting.
2. **Given** the PLP route (`products/page.tsx`), **When** it fetches products, **Then** it uses the DAL's `getFormattedProducts()` which internally calls `formatProduct()` on each result — no inline 40-line mapping logic.
3. **Given** the PDP route (`product/[slug]/page.tsx`), **When** it fetches a product, **Then** it uses the DAL's `getFormattedProduct()` with variant and attribute data resolved inside the DAL — no inline variant mapping logic.

---

### User Story 4 - Error Resilience (Priority: P2)

If a single section component crashes, only that section shows an error placeholder — the rest of the storefront continues to render. If a template is missing or corrupt, the system falls back gracefully with logging.

**Why this priority**: Production storefronts must be resilient. A bad FAQ section should never take down the entire homepage.

**Independent Test**: Inject a throwing component into one section and verify only that section shows an error boundary fallback while other sections render normally.

**Acceptance Scenarios**:

1. **Given** a section component throws an error during rendering, **When** the SectionRenderer processes all sections, **Then** only the failing section displays a subtle error placeholder, and all other sections render normally.
2. **Given** a merchant's template slug doesn't match any registered template, **When** the registry resolves the template, **Then** it falls back to `elegance`, logs a warning with the invalid slug, and the storefront renders normally.
3. **Given** a storefront route encounters an unrecoverable error, **When** the error boundary catches it, **Then** a themed error page is displayed (matching the store's branding) instead of the default Next.js error page.

---

### User Story 5 - Template Preview Mode (Priority: P3)

A merchant previewing a different template sees a floating "Preview Mode" banner, and the entire storefront renders with the previewed template's Shell, pages, and CSS — without affecting the live store.

**Why this priority**: Important for the template selection workflow but not core to the architecture refactor.

**Independent Test**: As a store owner, visit the storefront with `?template_preview=midnight` and verify the preview template renders with a visible preview banner.

**Acceptance Scenarios**:

1. **Given** a store owner visits their storefront with `?template_preview=midnight`, **When** the layout resolves the context, **Then** it loads the `midnight` template's Shell and CSS, marks the context as `isPreview: true`, and displays a floating "Preview Mode" banner.
2. **Given** a non-owner visits a storefront with `?template_preview=midnight`, **When** the proxy processes the request, **Then** the preview parameter is ignored and the live template renders normally.

---

### User Story 6 - Agent-Ready Template Workflow (Priority: P2)

An AI coding agent is tasked with "create a brutalist storefront template." The agent skill triggers, the agent reads `TEMPLATE_AUTHORING.md`, runs the scaffold script, fills out `DESIGN.md`, implements components following the documented rules, and validates via tests.

**Why this priority**: Future templates will be built by agents, so the architecture must be self-documenting and machine-enforceable.

**Independent Test**: Simulate the agent workflow by following the `storefront-template` skill instructions end-to-end and verifying a new template can be created without referencing any source code outside the documented entry points.

**Acceptance Scenarios**:

1. **Given** an agent reads `TEMPLATE_AUTHORING.md`, **When** it follows the documented file structure, import restrictions, and conventions, **Then** the resulting template compiles without errors and passes all contract tests.
2. **Given** the `storefront-template` skill is triggered, **When** the agent follows the step-by-step workflow, **Then** it produces a complete template with: `DESIGN.md`, all page/section components, scoped CSS, `defineTemplate()` registration, and passing tests.

---

### Edge Cases

- What happens when a merchant has zero storefront sections in the database? The DAL falls back to `defaultStorefrontSections`.
- What happens when a template's CSS file fails to load? The storefront renders with inherited shared design tokens — no visual breakage, just missing template-specific overrides.
- What happens when `defineTemplate()` receives an incomplete template (missing sections)? TypeScript compilation fails, and if somehow bypassed, the contract test catches it.
- What happens when a section's JSONB content in the database doesn't match the expected Zod schema? The Zod schema provides defaults for optional fields and logs a warning for structural mismatches — the section renders with fallback content rather than crashing.
- What happens when the scaffold script is run with a slug that already exists? The script exits with an error: "Template 'midnight' already exists."

## Requirements *(mandatory)*

### Functional Requirements

#### Data Access Layer (DAL)

- **FR-001**: System MUST provide a `getStorefrontContext(subdomain)` function that returns a unified object containing `store`, `merchant`, `template`, `templateModule`, `sections`, `menus`, `categories`, `themeVars`, and `isPreview` — resolving all tenant context in a single call.
- **FR-002**: System MUST provide a `formatProduct(rawProduct)` utility that transforms raw database product records into the canonical `Product` type, handling attribute name resolution, variant combination building, and nullable field fallbacks.
- **FR-003**: System MUST apply `'use cache'` with `cacheTag()` on DAL functions for granular invalidation using tags: `storefront:{merchantId}`, `products:{merchantId}`, `sections:{merchantId}`.

#### Template Contract & Shell Pattern

- **FR-004**: System MUST provide a `defineTemplate()` builder function that validates a template module has: metadata, Shell, 4 page components (`home`, `plp`, `pdp`, `standard`), and all 10 section renderers. Incomplete templates must fail at TypeScript compilation time.
- **FR-005**: Each template MUST export a `Shell` component that encapsulates Navbar, content wrapper (with template-specific padding/max-width), and Footer. The shared storefront layout MUST contain zero template-specific conditionals.
- **FR-006**: Each template MUST export a `metadata` object containing: `slug`, `name`, `description`, `thumbnail`, `defaultTheme`, and `layoutConfig`.
- **FR-007**: System MUST provide a `createDefaultSection(key)` helper that returns the shared fallback section renderer for a given section key, allowing templates to explicitly delegate to shared implementations.

#### Section Type System

- **FR-008**: System MUST define `StorefrontSection` as a discriminated union type where the `sectionKey` field determines the `content` type (e.g., `{ sectionKey: 'hero', content: HeroContent }`).
- **FR-009**: System MUST provide Zod schemas for each section's content type, used to validate JSONB content when reading from the database. Invalid content MUST log a warning and fall back to default content for that section type.
- **FR-010**: Section component props MUST be per-section-key typed. Each section component receives `{ content: T, merchantId: string, subdomain: string }` where `T` is the specific content type for that section key — no generic `SectionProps` with `as any` casts.
- **FR-011**: Every registered template MUST declare all 10 section renderers. Templates that want shared behavior MUST use `createDefaultSection(key)` explicitly.

#### CSS Architecture

- **FR-012**: System MUST maintain a shared `storefront-tokens.css` file containing common design tokens inherited by all templates.
- **FR-013**: Each template MUST have its own scoped CSS file with all styles nested under `.storefront-template-{slug}`.
- **FR-014**: The layout MUST dynamically load only the active template's CSS, not import all template CSS files statically.

#### Component Organization

- **FR-015**: Shared storefront components MUST be organized in: `primitives/` (dumb reusable atoms), `shared/` (interactive shared components), and `pages/` (template-agnostic page-level client components like Cart and Checkout).
- **FR-016**: Cart and Checkout MUST remain template-agnostic shared pages, receiving theme tokens via CSS variables and wrapped by the template's Shell.

#### Error Handling

- **FR-017**: System MUST wrap each section in the SectionRenderer with a `SectionErrorBoundary` that catches rendering errors and displays a subtle placeholder without affecting other sections.
- **FR-018**: Storefront routes MUST have an `error.tsx` that renders a themed error page matching the store's branding.
- **FR-019**: The template registry MUST log a warning when falling back to the default template due to an invalid slug.

#### Theme Infrastructure

- **FR-020**: All theme infrastructure (design token types, font registry, CSS variable generator) MUST be consolidated in `lib/storefront/theme/`.

#### Template Scaffold & DX

- **FR-021**: System MUST provide a `bun run scaffold:template <slug>` command that generates a complete template directory with: `defineTemplate()` boilerplate, Shell stub, 4 page stubs, 10 section stubs (some using `createDefaultSection()`), scoped CSS file, `DESIGN.md` with TODO placeholders, and `__tests__/` with smoke tests.
- **FR-022**: System MUST provide a `TEMPLATE_AUTHORING.md` document covering: architecture overview, file structure contract, `defineTemplate()` API, section contract, CSS conventions, shared primitives catalog, anti-patterns, agent rules, and testing instructions.
- **FR-023**: Each template MUST have a `DESIGN.md` with: visual identity, color palette, typography choices, component styling notes, and CSS token overrides.

#### Agent-Ready Infrastructure

- **FR-024**: System MUST include a `.agents/skills/storefront-template/SKILL.md` that encodes the complete template creation workflow: scaffold → design → implement → test → validate.
- **FR-025**: `TEMPLATE_AUTHORING.md` MUST include an "Agent Rules" section with machine-enforceable constraints: import restrictions, no `as any`, must use `defineTemplate()`, must pass contract tests, CSS scoping rules, shared primitives first.

#### Testing

- **FR-026**: System MUST include a `templates/__tests__/template-contract.test.ts` that programmatically validates every registered template: Shell exists, 4 page components exist, all 10 sections declared, metadata complete, CSS scoping class present.
- **FR-027**: The scaffold script MUST generate per-template `__tests__/` with render smoke tests for each page and section component.

### Key Entities

- **TemplateModule**: The primary interface defining a template's exports — Shell, pages, sections, metadata.
- **StorefrontSection (Discriminated)**: A union type mapping each `sectionKey` to its specific `content` type, stored as JSONB in the database.
- **StorefrontContext**: The unified data object returned by the DAL, containing all tenant-specific data needed to render a storefront.
- **ShellProps**: The props interface for a template's Shell component, including store, menus, categories, footer section, theme variables, and children.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All storefront route pages contain fewer than 30 lines of orchestration code (excluding skeleton components and imports), with all data fetching delegated to the DAL.
- **SC-002**: Zero `as any` casts exist in the storefront rendering pipeline (template index files, section renderer, section components, page components).
- **SC-003**: A new template can be scaffolded and pass all contract tests within 5 minutes of running the scaffold command (before any customization).
- **SC-004**: An AI agent following `TEMPLATE_AUTHORING.md` can produce a template that compiles and passes all tests without referencing any source code outside the documented entry points.
- **SC-005**: If a single section component throws, all other sections on the page continue to render — verified by error boundary integration tests.
- **SC-006**: The shared storefront layout (`app/(storefront)/[subdomain]/layout.tsx`) contains zero template-specific conditionals (no `if template === "elegance"` branches).
- **SC-007**: The existing elegance template continues to render identically to the pre-refactor state for all page types (home, PLP, PDP, cart, checkout, standard pages).

## Assumptions

- The existing elegance template is the only template that needs migration; no other templates exist.
- The database schema for `storefront_sections` (JSONB content column) does not need modification — only the TypeScript types and validation layer changes.
- The proxy/middleware (`proxy.ts`) remains unchanged — subdomain resolution and header injection continue to work as-is.
- The existing Zustand cart store and checkout flow remain unchanged — only their component organization moves.
- Redis proxy cache for middleware stays in place; `use cache` with `cacheTag()` is only for the DAL functions used in Server Components.
- The 10-section catalog is fixed and does not expand as part of this refactor.
- The `components/storefront/pages/` directory is a new organizational addition for existing page-level client components (CartClientPage, CheckoutClientPage, etc.) — their internal logic doesn't change, only their file location.
