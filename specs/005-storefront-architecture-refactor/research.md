# Research & Technical Decisions: Storefront Architecture Refactor

**Feature**: 005-storefront-architecture-refactor
**Status**: Completed

## 1. Data Access Layer (DAL) Architecture

**Decision**: Implement a centralized `getStorefrontContext(subdomain)` function that returns a unified object (`store`, `merchant`, `template`, `sections`, `menus`, `categories`, `themeVars`, `isPreview`).
**Rationale**: Currently, every storefront route (`app/(storefront)/[subdomain]/**/*.tsx`) independently fetches its own data, formats it, handles template resolution, and constructs the store context. This causes massive duplication and fragility. A single DAL function ensures all routes get consistent data and simplifies the Next.js page components to just thin orchestrators.
**Alternatives considered**: 
- Keep fetching at the route level but use shared helper functions. (Rejected: Still leaves too much orchestration logic in the route components).

## 2. Template Contract & Registration

**Decision**: Implement a `defineTemplate()` builder function that strictly types and validates template registration at compile-time.
**Rationale**: Templates were loosely typed, often relying on `as any` casts, especially when mapping section components in the registry. `defineTemplate()` enforces that every template provides a Shell, 4 specific page components, metadata, and all 10 required section renderers.
**Alternatives considered**:
- Rely solely on TypeScript interfaces. (Rejected: A builder function provides better DX, allows for runtime validation or metadata injection if needed, and forces the developer through a structured API).

## 3. Section Type System

**Decision**: Use a discriminated union for `StorefrontSection` types based on `sectionKey`, combined with Zod schemas for runtime validation of the JSONB database content.
**Rationale**: The database stores section content as JSONB. Previously, components received a generic `SectionProps` and cast the content using `as any`. By defining a discriminated union, TypeScript can narrow the `content` type automatically based on the `sectionKey`. Zod schemas ensure the data coming from the DB actually matches the expected type, providing defaults for missing fields instead of crashing.
**Alternatives considered**:
- Strict relational tables for each section type. (Rejected: Destroys flexibility and makes adding new sections a massive database migration task).
- Just TypeScript types without Zod. (Rejected: Unsafe at the runtime boundary; corrupt JSONB would crash the page).

## 4. CSS Architecture

**Decision**: Hybrid approach: A shared `storefront-tokens.css` for common design tokens (colors, spacing, typography variables), plus a scoped `styles.css` per template (`.storefront-template-{slug}`).
**Rationale**: Templates need to look drastically different but share underlying UI primitives (like Shadcn components or atomic buttons). Shared tokens ensure primitives work out-of-the-box, while template-scoped CSS allows for heavy visual overrides without leaking styles to other templates.
**Alternatives considered**:
- Tailwind configuration per template. (Rejected: Next.js doesn't easily support dynamic Tailwind configs per request; requires complex build setups).
- CSS-in-JS (Styled Components/Emotion). (Rejected: Bad for React Server Components performance and caching).

## 5. Shell Pattern & Layout Ownership

**Decision**: Move Navbar, Footer, and content wrapping out of the shared Next.js `layout.tsx` and into a template-controlled `Shell.tsx` component.
**Rationale**: Different templates need fundamentally different layouts (e.g., sidebar nav vs. top nav, full-bleed content vs. max-width containers). If the shared layout tries to handle this, it becomes a mess of `if (template === 'x')` conditionals. Giving templates their own Shell component completely decouples layout from routing.

## 6. Component Taxonomy

**Decision**: Strict organization of shared components into `primitives/` (dumb UI atoms, e.g., `ProductCard`), `shared/` (complex/interactive components, e.g., `ImageGallery`), and `pages/` (template-agnostic full-page client components, e.g., `CartClientPage`).
**Rationale**: Prevents templates from duplicating complex logic while still allowing them to compose their own unique layouts.

## 7. Caching Strategy

**Decision**: Use Next.js 16 `'use cache'` directive on DAL functions with `cacheTag()` for granular invalidation (e.g., `cacheTag('storefront-merchant123')`).
**Rationale**: Aligns with the project's constitution for Next.js 16. Replaces ad-hoc `unstable_cache` wrappers. Allows Server Actions to selectively invalidate cache when a merchant updates their store.

## 8. Agent-Ready Tooling

**Decision**: Create a scaffold script (`bun run scaffold:template`), a master guide (`TEMPLATE_AUTHORING.md`), per-template `DESIGN.md`, and an agent skill.
**Rationale**: Future templates will be built by AI agents. Agents need a deterministic, heavily constrained environment to succeed without hallucinations or breaking contracts.
