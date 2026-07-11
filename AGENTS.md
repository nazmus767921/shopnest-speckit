<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->


# Core Principles & Architecture:
    - Library-First: Features start as standalone libraries with defined public APIs before application composition.
    - Functional Programming: Pure functions, immutable data transformations, side-effects isolated at boundaries.
    - Test-Driven Development (TDD): Red-Green-Refactor. Tests must be written and approved before implementation code.
    - Integration Testing: Mandatory for library contracts, inter-service boundaries (Postgres, Resend, Storage, Telegram), and shared Zod schemas.
    - RSC by Default: `"use client"` isolated to interactive leaves.
    - "use cache" Granularity: Apply `"use cache"` only on data-fetching functions/components, never globally at page/layout level. Banned route segment config variables.
    - React Compiler: Automated optimization; manual `useMemo`/`useCallback` strictly forbidden.
    - Prerendering Safety: Wrap dynamic/non-deterministic operations (`cookies()`, `headers()`, etc.) in `<Suspense>` and call `await connection()` from `"next/server"` to prevent static build abort errors.
    
# Eleven Non-Negotiable Invariants:
    1. Merchant-ID Filter: Every query must include merchant_id from `auth.api.getSession()`, never from client.
    2. Stock Non-negative: `products.stock_count` >= 0 via Postgres transactions with `WHERE stock_count >= quantity` guard.
    3. Price Snapshotted: `order_items.unit_price` is written once at checkout.
    4. Auth Secret: `BETTER_AUTH_SECRET` and server auth instances never imported in client code.
    5. Subdomain Immutable: `merchants.subdomain` rejects UPDATE after INSERT.
    6. Email Non-blocking: Email dispatch wrapped in try/catch (best-effort delivery).
    7. Limits Enforced Server-side: Subscription plan limits checked in Server Actions/API routes.
    8. UI Primitives Only: Composed from Shadcn UI components under `components/ui/`.
    9. Shadcn UI First: Adopt Shadcn UI default design system and components. Avoid building custom components unless necessary.
    10. Payment Snapshot Priority: Use `payment.featuresAtPaymentTime` to resolve grand-fathered features/limits; use warnings, not hard-blocks during verification.
    11. Icons from Registry Only: ALL icons MUST be imported from `lib/icons.ts`, never directly from `lucide-react` or any other icon library. If an icon is needed but not yet exported from `lib/icons.ts`, add it there first, then import from the registry. This ensures a single source of truth for icon switching.

# Security & Secrets:
    - Multi-tenant isolation at application query layer (explicit merchantId) and Postgres RLS.
    - Anonymous Supabase client: Storage bucket RLS must grant access `TO public`.
    - Secrets module evaluation: Do not throw on missing env secrets during build phase (`process.env.NEXT_PHASE === "phase-production-build"`).

# Technical Conventions:
    - Zod validation: Use `error.issues[0].message` for safeParse errors. Use `z.url()` and `z.email()`.
    - Next.js Image: Must include `sizes` prop when using `fill`.
    - Zustand: Verify store has finished hydration (`useStore.persist.hasHydrated()`) before redirects.




# MUST FOLLOW
- Do not run build command or `bun run build` , `bun build` or dev server (`bun dev`) command without permission. Ask for permission before running.
-  use `bun` command to run scripts not `npm` or `pnpm`. `npx` is equal to `bunx`.
- All primitives like input, select, textarea, button, sheet, dialog, confirmation dialog, dropdown, table, menu, toast, tooltip, popover, badge, avatar, card etc must use custom components from `components/ui/`. If not available then ask if you should create one.
- ALL icons MUST be imported from `@/lib/icons`. NEVER import directly from `lucide-react` or any other icon library. If an icon is missing from `lib/icons.ts`, export it there first, then use it. This is non-negotiable.