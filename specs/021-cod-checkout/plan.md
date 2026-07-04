# Implementation Plan: Cash on Delivery (COD) Checkout Integration

**Branch**: `021-cod-checkout` | **Date**: 2026-07-04 | **Spec**: [specs/021-cod-checkout/spec.md](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/specs/021-cod-checkout/spec.md)

**Input**: Feature specification from `/specs/021-cod-checkout/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Complete the integration of the Cash on Delivery (COD) payment method. This feature enables merchants to configure standard Cash on Delivery or "Pay Delivery Charge First" (requiring upfront shipping fees via bKash/Nagad), surfaces it in the storefront checkout, bypasses transaction verification when appropriate, introduces a new `returned` order status, and automatically restores stock levels upon delivery rejection.

## Technical Context

**Language/Version**: Next.js 16.2.9, React 19, TypeScript 5.x

**Primary Dependencies**: better-auth, drizzle-orm, pg, lucide-react, zod, @tanstack/react-form, tailwindcss

**Storage**: PostgreSQL (hosted on Supabase), Drizzle ORM

**Testing**: Vitest (`pnpm test`)

**Target Platform**: Vercel Serverless / Next.js App Router

**Project Type**: Web Application

**Performance Goals**: Checkout completion step (payment step) under 15 seconds (no transaction ID required for standard COD). Stock restoration on return completes in under 1 second.

**Constraints**:
- Rely entirely on the automated React Compiler for render optimization; manual optimization boilerplate (`useMemo`, `useCallback`, `React.memo`) is strictly forbidden.
- `cacheComponents: true` enabled in `next.config.ts`.
- Any component executing dynamic operations (including `cookies()`, `headers()`) must invoke `await connection()` from `"next/server"` and be wrapped inside a `<Suspense>` boundary to prevent build-time static prerendering abort errors.

**Dynamic Route Caching**:
The settings route `app/(dashboard)/dashboard/settings/page.tsx` and storefront checkout route `app/(storefront)/[subdomain]/checkout/page.tsx` check user sessions (which dynamic cookies/headers rely on). We will wrap these page elements in `<Suspense>` blocks and perform `await connection()` at the page component entries.

**Scale/Scope**: Multi-tenant storefront settings (including wallet fields), storefront checkout flows, and merchant dashboard order lists/details.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Library-First)**: Database schema definitions and query functions (e.g. `updateStoreSettings`, `updateOrderStatus`) reside in reusable library modules under `db/schema.ts` and `db/queries/`.
- **Principle II (Functional Programming)**: Side effects are kept strictly at the database boundary. Core state mapping is pure.
- **Principle III (Test-First)**: Unit/integration tests will be written in a new file `__tests__/cod-checkout.test.ts` before writing production code.
- **Principle IV (Integration Testing)**: Integration tests will be written for database transitions, including validating stock restoration when an order is updated to the `returned` status.
- **Principle V (Invariants & Simplicity)**:
  - *Invariant 1*: Every merchant-scoped query will filter by `merchantId` resolved via `auth.api.getSession()`.
  - *Invariant 2*: Stock count increments/decrements will use safe transaction guards.
  - *Invariant 7*: Subscription plan limits and features (`plan.features.cod`) are checked on the server side in `updateStoreSettingsAction` before enabling COD.
  - *Invariant 8 & 9*: UI switches and inputs will be built using UI primitives from `components/ui` complying with `DESIGN.md` tokens (no custom bare colors or shadows).
- **Principle VI (Next.js 16 & React 19)**: Component-driven caching and React Compiler compliance are enforced. Dynamic headers/cookies usage is wrapped in `<Suspense>`.

## Project Structure

### Documentation (this feature)

```text
specs/021-cod-checkout/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── checklists/
    └── requirements.md  # Spec Quality Checklist
```

### Source Code (repository root)

```text
app/
├── (dashboard)/
│   └── dashboard/
│       └── settings/
│           └── components/
│               └── StoreSettingsForm.tsx
├── (storefront)/
│   └── [subdomain]/
│       └── checkout/
│           └── actions.ts
└── actions/
    └── settings.ts

components/
└── storefront/
    └── CheckoutClientPage.tsx

db/
├── schema.ts
└── queries/
    ├── merchants.ts
    └── orders.ts

lib/
└── validations/
    ├── settings.ts
    └── checkout.ts

__tests__/
└── cod-checkout.test.ts
```

**Structure Decision**: Single web application layout following the Next.js App Router conventions. All queries and settings reside in their respective functional modules.

## Complexity Tracking

No principle or invariant violations are present in this design. The implementation maps directly to existing patterns.
