# Implementation Plan: Retail Storefront Template & Flash Sales

**Branch**: `003-retail-storefront-template` | **Date**: 2026-07-15 | **Spec**: [spec.md](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/specs/003-retail-storefront-template/spec.md)

**Input**: Feature specification from `/specs/003-retail-storefront-template/spec.md`

---

## Summary
Implement a high-fidelity generic storefront template (named `retail`) that mimics the visual structure, layout, typography, and spacing of the provided mockup. To support the template's functional layout, we will extend the database schema to store category images and introduce a merchant-managed Flash Sales feature with transaction-safe stock countdowns and live client-side timers.

---

## Technical Context

**Language/Version**: Next.js 16.2 (Next.js 16/React 19), TypeScript, Bun runner
**Primary Dependencies**: Drizzle ORM, Tailwind CSS, Radix UI (Shadcn UI), Zustand
**Storage**: PostgreSQL (Supabase)
**Testing**: Vitest, React Testing Library
**Target Platform**: Node.js/Vercel (SSR/RSC with `'use cache'`)
**Project Type**: Web application
**Performance Goals**: Sub-second page loads using Next.js caching; client-side timer calculations; real-time transactional locks under < 200ms
**Constraints**: Multi-tenant database checks (filter by dynamic merchant_id from auth session); all icons imported from `@/lib/icons`

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Library-First**: The core flash sale validation logic (checking active times, calculating discounts) will be written as pure functions in `lib/promotions/flash-sales.ts`.
- **Test-Driven Development (TDD)**: Test files (`__tests__/flash-sales.test.ts`, `__tests__/category-images.test.ts`) must be created and run in a failing state before write edits to source files.
- **RSC by Default**: Interactive components (the countdown timer card, wishlist heart button, dynamic category selection bar) will be isolated as client leaves using `"use client"`. Layout files, grid wrappers, and headers remain React Server Components (RSC).
- **"use cache" Granularity**: Fetching functions for templates, active flash sales, and storefront collections will use `'use cache'` with specific revalidation tags (e.g. `revalidateTag("categories-[id]")`).
- **Database/Tenancy Isolation**: Every database query for flash sales or categories must dynamically check and filter by the session-derived `merchantId`.
- **UI Primitives**: Custom primitives are banned. Forms, buttons, inputs, selects, dialogs, progress bars, and tooltips will strictly compose custom Shadcn UI primitives from `components/ui/`.
- **Icons Central Registry**: Lucide icons are never imported directly. We will register any required icons (like `Zap`, `Bell`, `User`, `MoreHorizontal`, etc.) in `@/lib/icons` first, then import them.
- **Transactional Stock Limits**: Checking flash sale inventory limits (`soldQuantity + quantity <= limitQuantity`) and decrementing remaining stock will run in a Postgres transaction using Drizzle `FOR UPDATE` pessimistic row-locking in `createOrder`.

---

## Project Structure

### Documentation (this feature)

```text
specs/003-retail-storefront-template/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 architectural decisions
├── data-model.md        # Database schema details and RLS policies
├── quickstart.md        # Scenario testing and verification guide
└── contracts/
    ├── categories-contract.md   # Category update actions contract
    └── flash-sales-contract.md  # Flash sale action contracts
```

### Source Code changes

```text
app/
├── (dashboard)/
│   └── dashboard/
│       └── flash-sales/
│           ├── page.tsx               # Flash sales list in admin panel
│           └── components/
│               ├── FlashSalesClient.tsx # Interactive list client
│               └── FlashSaleModal.tsx   # Modal form to add/edit flash sales
├── actions/
│   ├── categories.ts            # [MODIFY] Accept and validate category image
│   └── flash-sales.ts           # [NEW] Server actions for flash sales CRUD
components/
└── ui/
    └── progress.tsx             # [MODIFY/CHECK] shadcn UI progress bar
db/
├── migrations/
│   └── 0035_add_category_image_and_flash_sales.sql  # [NEW] schema migration
├── queries/
│   ├── categories.ts            # [MODIFY] Support category image fields
│   ├── flash-sales.ts           # [NEW] Fetch/modify flash sale records
│   └── orders.ts                # [MODIFY] Transactional price override & stock verification
└── schema.ts                    # [MODIFY] Drizzle table configurations
lib/
├── cache/
│   └── flash-sales.ts           # [NEW] Next.js caching layers
├── icons.ts                     # [MODIFY] Register template icons
└── validations/
    └── flash-sales.ts           # [NEW] Zod payload validators
templates/
├── registry.ts                  # [MODIFY] Register 'retail' template key
├── types.ts                     # [MODIFY] Support category image attributes
├── retail/                      # [NEW] Standalone template folder
│   ├── index.ts                 # Export template routes
│   ├── styles.css               # Typography, borders, color tokens for template
│   ├── RetailHomePage.tsx       # Storefront homepage wrapper
│   ├── RetailNavbar.tsx         # Search header and topbar layout
│   ├── RetailFooter.tsx         # Detailed 4-column footer
│   ├── RetailPDP.tsx            # Product details layout
│   ├── RetailPLP.tsx            # Catalog listing and category selector layout
│   ├── RetailCartPage.tsx       # Shopping cart view
│   ├── RetailStandardPage.tsx   # Custom dynamic storefront page
│   └── components/
│       ├── RetailProductCard.tsx     # Card with rating stars and heart icons
│       └── RetailFlashSaleCard.tsx   # Card with countdown timer & progress bars
```

**Structure Decision**: Option 1 (Single Project Next.js layout). We add the template under the `templates/` folder and new routes/components to the admin dashboard under `app/(dashboard)`.

---

## Complexity Tracking

*No constitution violations are planned. Direct database constraints and transaction locks are required for safety and multi-tenant isolation.*
