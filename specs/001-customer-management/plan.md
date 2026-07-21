# Implementation Plan: Storefront Customer Portal & Admin Management

**Branch**: `001-customer-management` | **Date**: 2026-07-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-customer-management/spec.md`

## Summary
Implement storefront customer authentication (sign-up, sign-in, session routing), address books, order histories, and merchant-facing customer directories, individual details, and account suspension/IP block moderation tools. Supports automatic retroactive binding of past guest orders upon account registration.

## Technical Context

**Language/Version**: TypeScript / Next.js 16 / React 19 / Drizzle ORM

**Primary Dependencies**: `better-auth`, `drizzle-orm`, `@tanstack/react-table`, `@tanstack/react-form`, `zod`

**Storage**: PostgreSQL (Supabase) + Redis (Upstash) for IP ban caching and rate limiting

**Testing**: Vitest (Unit and integration tests)

**Target Platform**: Node.js / Vercel

**Project Type**: Multi-tenant web-service (SaaS ecommerce storefront + dashboard)

**Performance Goals**: IP blocklist resolution under 10ms at middleware layer, directory queries under 100ms.

**Constraints**: Multi-tenant isolation (strict merchant_id scoping), Next.js 16 caching paradigm, React Compiler compatibility (no manual `useMemo`/`useCallback`).

**Scale/Scope**: Support 10,000+ customers per merchant, paginated queries, instant session revocation.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Merchant-ID Filter (Invariant 1)**: Verified. Every customer/order query resolves `merchantId` from headers/session, never from the client.
- **UI Primitives (Invariant 8, 9)**: Verified. All form elements, buttons, inputs, alerts, and tables will use Shadcn components under `components/ui/`.
- **Icon Registry (Invariant 11)**: Verified. All icons are imported from `@/lib/icons`, never directly from `lucide-react`.
- **Next.js 16 Caching & Prerendering**: Verified. Pages accessing session context or cookies are wrapped in `<Suspense>` to prevent prerendering errors.

---

## Project Structure

### Documentation (this feature)
```text
specs/001-customer-management/
├── plan.md              # This file
├── research.md          # Research options and decisions
├── data-model.md        # Database schema additions and indexes
├── quickstart.md        # Verification scripts and steps
├── contracts/
│   └── actions.md       # Server Action signatures
└── checklists/
    └── requirements.md  # Quality validation checklist
```

### Source Code Changes
```text
db/
├── schema.ts            # Extend user table, add customerAddresses and bannedIps
db/queries/
└── customers.ts         # Customer search, filter, address management, IP block, and order binding queries
proxy.ts                 # Update middleware to load IP blacklist and block traffic
app/
├── (storefront)/
│   └── [subdomain]/
│       ├── login/       # Storefront customer sign-in page
│       ├── register/    # Storefront customer sign-up page
│       ├── profile/     # Customer dashboard (address management, profile)
│       └── orders/      # Customer order history list & details
├── (dashboard)/
│   └── dashboard/
│       └── customers/   # Merchant Customers directory table, search & details views
lib/
└── auth/
    └── auth.ts          # Verify scheme adapter definitions
```

---

## Proposed Changes

### Database Layer
- **[MODIFY] [schema.ts](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/db/schema.ts)**:
  - Add `merchantId` field to `user` table.
  - Remove table-level `unique()` modifier on `email`. Add composite `uniqueIndex` on `(email, merchantId)`.
  - Add partial index for null `merchantId` global admins.
  - Define `customerAddresses` and `bannedIps` tables.
- **[NEW] [customers.ts](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/db/queries/customers.ts)**:
  - Implement queries: `getCustomersByMerchant`, `getCustomerDetails`, `createCustomerAddress`, `bannedIpCheck`, `bindGuestOrdersToUser` (with OTP verification).

### Authentication Layer
- **[MODIFY] [auth.ts](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/lib/auth/auth.ts)**: Ensure Better Auth schema maps correctly to the updated `user` structure.

### Middleware/Routing Layer
- **[MODIFY] [proxy.ts](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/proxy.ts)**:
  - Inside the subdomain branch, retrieve client IP.
  - Match against `bannedIps` using Redis cache lookup or fast SQL query.
  - If banned, return `NextResponse.rewrite(new URL('/blocked', request.url))` or a raw 403 response.

### Storefront Views (Subdomain routes)
- **[NEW] storefront login/register/profile pages**: Create forms composed of components from `components/ui/` and icons from `@/lib/icons`.

### Merchant Dashboard Views
- **[NEW] merchant dashboard customer views**: Build directory table using `@tanstack/react-table` and moderation buttons.

---

## Verification Plan

### Automated Tests
- Run `bun test` or `vitest` to verify data layer integration:
  ```bash
  vitest run db/queries/__tests__/customers.test.ts
  ```

### Manual Verification
- Deploy storefront subdomains locally and execute scenarios in `quickstart.md`.
