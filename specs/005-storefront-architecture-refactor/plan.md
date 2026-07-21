# Implementation Plan: Storefront Architecture Refactor

**Branch**: `005-storefront-architecture-refactor` | **Date**: 2026-07-20 | **Spec**: [spec.md](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/specs/005-storefront-architecture-refactor/spec.md)

**Input**: Feature specification from `/specs/005-storefront-architecture-refactor/spec.md`

## Summary

Refactor the storefront domain to use a centralized Data Access Layer (`getStorefrontContext`), introduce a strict template contract with the `Shell` pattern via `defineTemplate()`, implement discriminated union section types backed by Zod schemas, and provide developer/agent tooling (scaffold script, contract tests, and `TEMPLATE_AUTHORING.md`) to enable future-proof, error-resistant template creation.

## Technical Context

**Language/Version**: TypeScript 5+ (Next.js 15/16 App Router)

**Primary Dependencies**: Next.js, Drizzle ORM, Zod, React 19, Tailwind CSS (for shared tokens)

**Storage**: PostgreSQL (via Supabase), JSONB for section content

**Testing**: Vitest (for contract tests)

**Target Platform**: Web (Vercel deployment)

**Project Type**: Multi-tenant Next.js Web Application

**Performance Goals**: Leverage Next.js 16 `'use cache'` for sub-50ms TTFB on storefront reads.

**Constraints**: Must maintain 100% visual backward compatibility for the existing `elegance` template. All template CSS must be properly scoped to prevent cross-template style pollution.

**Scale/Scope**: Impacts all storefront routes `app/(storefront)/[subdomain]/**`, the template registry, all section components, and the core routing middleware (preview mode).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Quality & Library-First**: ✅ Yes. Creating `lib/storefront` as a domain root. The DAL and `defineTemplate` are pure library functions independent of the Next.js routes.
- **TDD & Testing Standards**: ✅ Yes. Adding `template-contract.test.ts` to strictly validate the template interfaces.
- **User Experience & Consistency**: ✅ Yes. Shared primitives stay consistent; SectionErrorBoundaries improve resilience.
- **Performance & Caching Constraints**: ✅ Yes. Removing ad-hoc caching and implementing strict `'use cache'` with `cacheTag()` on the DAL functions per the Next.js 16 rules. Dynamic APIs will remain awaited.
- **Database Performance & Schema**: ✅ Yes. Using Zod to validate the JSONB content coming from the DB before it hits the React components, replacing unsafe `as any` casts.
- **Multi-Tenant Security**: ✅ Yes. `getStorefrontContext` will enforce `merchantId` filtering centrally.

## Project Structure

### Documentation (this feature)

```text
specs/005-storefront-architecture-refactor/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
lib/
└── storefront/                 # NEW: Core domain logic
    ├── data/
    │   ├── context.ts          # getStorefrontContext() DAL
    │   └── formatters.ts       # formatProduct()
    ├── theme/                  # Consolidated theme infrastructure
    │   ├── tokens.ts
    │   └── fonts.ts
    └── schema/                 # Zod schemas for sections
        └── sections.ts

templates/
├── registry.ts                 # UPDATED: Template registry & defineTemplate()
├── types.ts                    # UPDATED: Strict TemplateModule & Discriminated Sections
├── __tests__/
│   └── template-contract.test.ts # NEW: Validates all registered templates
├── TEMPLATE_AUTHORING.md       # NEW: Agent and developer guide
└── elegance/                   # REFACTORED: The existing template
    ├── DESIGN.md
    ├── Shell.tsx
    ├── styles.css
    ├── index.ts
    ├── components/
    │   ├── EleganceNavbar.tsx
    │   ├── EleganceFooter.tsx
    │   └── ElegancePLP.tsx
    └── sections/
        └── [10 section renderers]

components/storefront/
├── primitives/                 # Dumb UI atoms (ProductCard, PriceDisplay)
├── shared/                     # Interactive components (ImageGallery)
└── pages/                      # Template-agnostic client pages (Cart, Checkout)

app/
└── (storefront)/
    └── [subdomain]/            # REFACTORED: Thin route orchestrators
        ├── layout.tsx          # Dynamic CSS loading, Shell wrapper
        ├── page.tsx
        ├── products/page.tsx
        ├── product/[slug]/page.tsx
        └── error.tsx           # NEW: Themed error boundary

middleware.ts                   # UPDATED: Intercepts ?template_preview and injects header

scripts/
└── scaffold-template.ts        # NEW: Script to generate a new template

.agents/
└── skills/
    └── storefront-template/    # NEW: Agent skill for template creation
        └── SKILL.md
```

**Structure Decision**: The project adopts a Domain-Driven structure for the backend logic (`lib/storefront/`), a strict Template Pattern for the view layer (`templates/`), and a clear Component Taxonomy (`components/storefront/`). The Next.js routes become thin orchestrators linking the domain to the view.
