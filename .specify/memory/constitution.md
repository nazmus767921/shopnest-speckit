<!--
SYNC IMPACT REPORT
==================
- Version change: [CONSTITUTION_VERSION] (Template) -> 1.0.0
- List of modified principles:
  * [PRINCIPLE_1_NAME] -> I. Code Quality & Library-First Architecture
  * [PRINCIPLE_2_NAME] -> II. Test-Driven Development & Testing Standards
  * [PRINCIPLE_3_NAME] -> III. User Experience & Component Consistency
  * [PRINCIPLE_4_NAME] -> IV. Performance & Caching Constraints
  * [PRINCIPLE_5_NAME] -> V. Database Performance & Schema Validation
- Added sections:
  * Security & Multi-Tenant Tenancy Requirements
  * Transactional Integrity & Subscription Limits
- Removed sections: None
- Templates requiring updates:
  * .specify/templates/plan-template.md (✅ updated / no changes needed)
  * .specify/templates/spec-template.md (✅ updated / no changes needed)
  * .specify/templates/tasks-template.md (✅ updated / no changes needed)
- Follow-up TODOs: None
-->

# ShopNest Constitution

## Core Principles

### I. Code Quality & Library-First Architecture
Every feature starts as a standalone library with defined public APIs before application composition. We isolate logic using pure functions and immutable data transformations, keeping side-effects at the system boundaries. We strictly adhere to Next.js 16 React Server Component (RSC) defaults, keeping client interactivity isolated to leaf nodes. We use the React Compiler for automated optimization; manual `useMemo` and `useCallback` are strictly forbidden. ALL icons MUST be imported from the central registry `@/lib/icons` (`lib/icons.ts`), never directly from Lucide or other libraries.

### II. Test-Driven Development & Testing Standards
Test-Driven Development (TDD) is non-negotiable. Tests must be written, run, and approved in a failing state before any implementation code is written. Integration testing is mandatory for all library contracts, inter-service boundaries (Postgres, Resend, Storage, Telegram), and shared Zod schemas. We run automated unit and integration tests using Vitest to ensure code correctness and regression safety.

### III. User Experience & Component Consistency
All UI primitives (inputs, buttons, cards, menus, dialogs, etc.) MUST be composed from Shadcn UI components under `components/ui/`. Custom primitive UI components are prohibited unless explicitly approved. We ensure UI consistency by verifying that Zustand state stores are fully hydrated (`useStore.persist.hasHydrated()`) before performing any client-side routing redirects. Email dispatches are treated as best-effort and non-blocking, wrapped in try/catch blocks so that failures do not interrupt the core user flow.

### IV. Performance & Caching Constraints
We leverage the Next.js 16 caching paradigm. Caching is opt-in: apply the `'use cache'` directive only on specific data-fetching functions/components at a granular level, never globally at the page or layout level. Legacy route segment configs are banned. To prevent static prerendering build failures, any dynamic/non-deterministic operations (e.g., calling `cookies()`, `headers()`) must be wrapped in a `<Suspense>` boundary and preceded by `await connection()` from `"next/server"`. All dynamic APIs must be `awaited` asynchronously.

### V. Database Performance & Schema Validation
We run on Drizzle ORM and Supabase Postgres. All input validation must be enforced using Zod, handling errors gracefully by reporting `error.issues[0].message`. The application code must never throw on missing environment secrets during the production build phase (`process.env.NEXT_PHASE === "phase-production-build"`). Images must use the Next.js `Image` component and include the `sizes` prop when using `fill` to avoid layout shifts and optimize loading performance.

## Security & Multi-Tenant Tenancy Requirements
Multi-tenant isolation is enforced at both the database level via Postgres RLS and the application query layer. Every database query MUST filter by `merchant_id` obtained dynamically from the server session via `auth.api.getSession()`, never from client-provided values. The authentication secret `BETTER_AUTH_SECRET` and server auth instances must never be imported into client-side code. To secure assets, anonymous Supabase client storage bucket RLS must explicitly grant access `TO public`.

## Transactional Integrity & Subscription Limits
Database transactions must be used to enforce stock boundaries, ensuring `products.stock_count` never drops below 0 by validating `WHERE stock_count >= quantity` inside the update query. The merchant subdomain (`merchants.subdomain`) is immutable and must reject updates after creation. For orders, `order_items.unit_price` must be snapshotted and written exactly once at the time of checkout. Subscription plan limits must be enforced on the server-side within Server Actions or API routes, and we prioritize using the `payment.featuresAtPaymentTime` snapshot to resolve grandfathered features or limits, using warnings rather than hard blocks during verification.

## Governance
1. All PRs and reviews must verify compliance with this constitution. Compliance checks must be integrated into the CI/CD workflow.
2. Development complexity must be justified against these principles; unnecessary architecture, overhead, or exceptions will be rejected.
3. Amendments to this constitution require a formal Pull Request, version increment, and migration plan if dependent templates are affected.
4. Keep the runtime development guidelines in `AGENTS.md` and `docs/quickstart.md` synchronized with this document.

**Version**: 1.0.0 | **Ratified**: 2026-07-14 | **Last Amended**: 2026-07-14
