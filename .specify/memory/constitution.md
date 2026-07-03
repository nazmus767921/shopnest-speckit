<!--
# Sync Impact Report

## Version Change
- **Old**: 1.0.0
- **New**: 1.3.0
- **Bump Type**: MINOR — added invariant 9 (DESIGN.md First); expanded invariants to 10; elevated DESIGN.md to binding rule across three sections

## Principles
- I. Library-First — unchanged
- II. Functional Programming — unchanged
- III. Test-First (NON-NEGOTIABLE) — rationale updated to self-reference
- IV. Integration Testing — unchanged
- V. Invariants & Simplicity — expanded to ten invariants (added DESIGN.md First at #9, shifted payment snapshot to #10)

## Sections Added
- Technical Conventions ✨ (AGENTS.md conventions migrated)

## Sections Expanded
- Security & Data Isolation — beefed up with route protection, auth plugins, session handling
- Development Workflow & Quality Gates — expanded with spec-driven workflow, scoping rules, protected files

## Sections Removed
- None

## Templates Updated
- `.specify/templates/plan-template.md` ✅
- `.specify/templates/spec-template.md` ✅
- `.specify/templates/tasks-template.md` ✅
- `.specify/templates/checklist-template.md` ✅

## Follow-up TODOs
- None — all placeholders resolved.
-->

# ShopNest Constitution

## Core Principles

### I. Library-First

Every feature MUST start as a standalone library before being composed into the
application. Libraries MUST be self-contained, independently testable, and
documented with a clear purpose. No monolithic feature blobs — every library
must expose functionality that could theoretically be reused outside the
ShopNest codebase. A library's public API surface and contract MUST be defined
before any consumer code is written.

**Rationale**: Isolating feature logic into libraries prevents entanglement
between domains (storefront, dashboard, admin), enables independent testing,
and preserves the ability to extract shared packages without cross-boundary
imports.

### II. Functional Programming

Prefer pure functions over mutable state; prefer composition over inheritance;
prefer immutable data transformations over in-place mutation. Side effects
MUST be isolated at system boundaries — API routes, database queries, I/O
operations, and third-party service calls. Core business logic MUST be written
as pure, testable functions with no hidden dependencies on global state, module
scope, or ambient contexts. When mutation is unavoidable (Zustand stores,
TanStack Query cache updates), the mutating code must be thin, explicit, and
kept at the outermost application layer.

**Rationale**: Pure functions are trivially testable, trivially composable, and
eliminate entire categories of bugs (unintended shared state, temporal coupling,
mutation order dependence). ShopNest's multi-tenant architecture benefits
directly from deterministic, context-independent logic.

### III. Test-First (NON-NEGOTIABLE)

Test-Driven Development is mandatory. Tests MUST be written and approved before
implementation code is written. The Red-Green-Refactor cycle MUST be strictly
enforced:

1. Write a test that specifies the desired behaviour — it MUST fail.
2. Obtain user approval on the test specification.
3. Confirm the test fails (Red).
4. Write the minimum implementation required to pass the test (Green).
5. Refactor while keeping all tests green (Refactor).

No production code shall be merged without corresponding tests. This includes
error paths, edge cases, and boundary conditions — not just the happy path.

**Rationale**: TDD is the single most effective practice for producing
correct, maintainable code. In a spec-driven workflow (per this constitution's
Development Workflow section), tests serve as the executable specification and
the acceptance gate for each user story.

### IV. Integration Testing

Integration tests are REQUIRED for:
- New library contract tests (verifying the public API of each library)
- Contract changes between libraries (breaking changes MUST be detected)
- Inter-service communication (Edge Functions ↔ Postgres, Resend ↔ email
  dispatch, Supabase Storage ↔ upload flows, Telegram notification dispatch)
- Shared schema validation (Zod schemas used across client/server boundaries)

Each user story MUST be independently testable end-to-end. Integration tests
must be written at the boundary of the system under test — do not mock the
boundary itself (e.g., test against a test Postgres instance, not a mocked DB).

**Rationale**: Library-first architecture only delivers value if libraries can
be tested in isolation AND in composition. Integration tests catch contract
breakage that unit tests miss, particularly across the async boundaries of
Supabase Edge Functions, Resend, and Telegram dispatch.

### V. Invariants & Simplicity

Ten non-negotiable invariants MUST be enforced in code review:

1. **Merchant-ID filter required**: Every merchant-scoped query MUST include an
   explicit `merchant_id` WHERE clause sourced from `auth.api.getSession()` —
   never from a client-supplied parameter.
2. **Stock non-negative**: `products.stock_count` must never go below zero. Use
   a Postgres transaction with `WHERE stock_count >= quantity` guard.
3. **Price snapshotted at order**: `order_items.unit_price` is written once at
   checkout and never recalculated from the current product price.
4. **Auth secret server-only**: `BETTER_AUTH_SECRET` and the `auth` server
   instance must never be imported in client-bundled code.
5. **Subdomain immutable**: `merchants.subdomain` must reject UPDATE after
   initial INSERT.
6. **Email non-blocking**: All email dispatch calls MUST be wrapped in
   try/catch — notification delivery is best-effort, order data integrity is
   not.
7. **Limits enforced server-side**: Subscription plan limits MUST be checked in
   Server Actions or API routes before committing operations — client-side
   checks are UX only.
8. **UI primitives only**: All UI MUST be composed from `components/ui` — never
   write inline Tailwind to replicate existing patterns. When `components/ui`
   lacks a needed primitive, extend it with the correct DESIGN.md tokens rather
   than inlining raw Tailwind.
9. **DESIGN.md First**: All UI — every component, page, and surface — MUST
   follow `DESIGN.md` as the single source of truth for visual presentation.
   This includes colors (use `bg-primary`, `text-shade-50`, `border-hairline-light`
   — never `bg-gray-200`, `text-gray-500`, `border-gray-300`), button shapes
   (`rounded-full` pill is the only allowed shape), text hierarchy (use
   `text-ink`, `text-shade-50`, `text-shade-40` — never `text-gray-*`), canvas
   polarity (two-track system), the no-shadows rule, and spacing tokens. Any PR
   introducing `gray-`, `blue-`, `bg-white`, `border-gray-`, `text-gray-`,
   `shadow-`, or bare `rounded` (without a token suffix) in component JSX
   SHALL be rejected.
10. **Payment snapshot priority**: When verifying a subscription payment, always
   prioritize features/limits snapshotted at submission time
   (`payment.featuresAtPaymentTime`) over live plan configurations
   (`targetPlan.features`) to preserve grandfathered limits. During payment
   verification, do not hard-block or throw if a merchant's resource count
   exceeds plan limits — use warnings instead, and enforce limits dynamically
   at runtime via the soft-cap resolved by `getMerchantPlan`.

Follow YAGNI: start simple, avoid speculative abstraction. Every implementation
plan MUST justify complexity against a simpler alternative that was rejected.

**Rationale**: These invariants are the hard-won lessons of the ShopNest
architecture. Violating any one of them is a production incident waiting to
happen — data breach (1, 4), oversell (2), financial misreporting (3), broken
customer links (5), silent data loss (6), billing bypass (7), design drift
(8, 9), or brand fragmentation (10).


## Security & Data Isolation

Multi-tenant data isolation is a first-class architectural constraint enforced
at two layers:

**Layer 1 — Application query layer (primary enforcement)**: Every function in
`db/queries/` MUST accept `merchantId` as an explicit required parameter and
include it in the WHERE clause. The `merchantId` MUST always be derived from
`auth.api.getSession()` — never from a client-supplied request body, URL
parameter, or header.

**Layer 2 — Postgres Row-Level Security (defence in depth)**: RLS policies on
merchant-scoped tables provide a secondary guard. Because ShopNest uses Better
Auth (not Supabase Auth), the client-side Supabase client makes calls
anonymously — any RLS policy on storage buckets MUST grant access `TO public`
(rather than `TO authenticated`) for dashboard upload workflows.

**Authentication**: Managed entirely by Better Auth. Sessions are stored in
Postgres via Drizzle adapter. The session token cookie uses `httpOnly`,
`sameSite: lax`, and `secure` in production. Four identity models exist:
merchant (email/password or Google OAuth), registered customer (email/password
or Email OTP), guest customer (anonymous short-lived session), and super admin
(email/password + TOTP 2FA).

**Secret management**: Environment variables containing secrets
(`BETTER_AUTH_SECRET`, `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `RESEND_API_KEY`)
MUST NEVER throw errors on missing values at module evaluation time without
checking `process.env.NEXT_PHASE !== "phase-production-build"` to prevent
build-time static evaluation crashes.

## Development Workflow & Quality Gates

All development follows a **spec-driven workflow** with the following rules:

1. Each feature begins with a specification in `specs/`.
2. An implementation plan (`.specify/templates/plan-template.md`) is created,
   including a **Constitution Check** gate that verifies the plan does not
   violate any principle or invariant in this constitution.
3. Implementation proceeds one user story at a time, in priority order
   (P1 → P2 → P3), with each story independently testable and deployable.
4. **Before moving to the next unit**:
   - The current unit works end-to-end within its defined scope.
   - No invariant defined in this constitution was violated.
   - All UI uses DESIGN.md tokens — no raw `gray-`, `blue-`, `bg-white`,
     `border-gray-`, `text-gray-`, or `shadow-` classes in component JSX.
   - No raw Tailwind utility strings were used to replicate a UI pattern that
     exists in `components/ui/`.
   - `npm run build` passes.
   - All tests pass (`pnpm test`).
5. Code review MUST enforce this constitution — any PR that violates a
   principle or invariant SHALL be rejected.
6. Complexity tracking in the plan template MUST document why simpler
   alternatives were rejected (see the "Complexity Tracking" section in
   `plan-template.md`).

## Technical Conventions

The following implementation-level conventions are binding and MUST be
enforced in code review. They complement the core principles above and
codify patterns derived from the ShopNest codebase.

### Zod Validation

- When handling `safeParse()` failures, extract the first error message using
  `error.issues[0].message` — not `error.errors[0].message`, which is not
  type-safe in Zod v4.
- Use `z.url()` and `z.email()` instead of the deprecated `z.string().url()`
  and `z.string().email()` (Zod v4 API removes string method overloads).

### Next.js & React

- Always include the `sizes` prop (e.g.,
  `sizes="(max-width: 1280px) 100vw, 1280px"`) whenever using the Next.js
  `<Image>` component with the `fill` attribute.
- When passing callbacks to client components that trigger side effects inside
  a `useEffect` (such as checking sessions), always memoize the callback using
  `useCallback` to prevent duplicate network calls or re-runs on text input
  keystrokes.

### Client-Side State

- When using Zustand `persist` middleware, always verify that the store has
  finished hydration (`useStore.persist.hasHydrated()`) before performing any
  client-side routing redirects or decisions based on whether store items are
  empty.

## Governance

This constitution supersedes all other practices, informal conventions, and
ad-hoc decisions. It is the binding contract for all code contributed to the
ShopNest codebase.

### Amendment Procedure

1. **Proposal**: A documented proposal describing the rationale, the specific
   change, and the impact on existing code.
2. **Approval**: Approval from the project lead or maintainer.
3. **Migration plan**: If the amendment invalidates existing code, a migration
   plan MUST be included specifying how and when existing violations will be
   remediated.
4. **Ratification**: The amendment is merged into this document and the version
   is bumped accordingly.

### Versioning Policy

- **MAJOR** — Backward-incompatible governance changes, principle removals, or
  fundamental redefinitions of existing principles.
- **MINOR** — New principles added, materially expanded guidance, or new
  sections.
- **PATCH** — Clarifications, wording improvements, typo fixes, and
  non-semantic refinements.

### Compliance

- All PRs and code reviews MUST verify compliance with this constitution.
- The Constitution Check gate in the plan template is the entry point — no
  implementation plan may proceed to Phase 0 research without passing it.
- **DESIGN.md is binding**: All UI design decisions — theme, colors, typography,
  component shapes, canvas polarity, spacing, and the no-shadows rule — MUST
  follow `DESIGN.md` (Invariant 9). This document is the single source of truth
  for visual presentation and takes precedence over any informal styling or
  ad-hoc color choices.
- Use `PROGRESS.md` for current phase, completed work, and open questions.

---

**Version**: 1.3.0 | **Ratified**: 2026-07-03 | **Last Amended**: 2026-07-03
