# Spec 18: DB-Driven Subscription Plan Maker

## Goal

Migrate all plan configuration from hardcoded constants scattered across ~10+ files into a fully database-driven `subscription_plans` table, and build a super admin UI to create, edit, and archive plans. After this unit, plan limits (product cap, order cap, category cap, image cap, feature flags) are read from the DB at runtime — no code change is needed to adjust a plan's rules.

---

## Context: Current State

Plan enforcement is hardcoded in multiple places today. These are the exact locations that must be replaced:

| File | Hardcoded logic |
|------|----------------|
| `db/queries/products.ts:75–88` | `merchant.plan === "starter"` → 50 product cap |
| `db/queries/categories.ts:74–85` | `plan === "starter"` → 5, `plan === "growth"` → 15 category caps |
| `db/queries/orders.ts:26–43` | `merchant.plan === "starter"` → 200 order/month cap |
| `app/actions/discounts.ts:33–36` | `merchantPlan !== "growth"` → blocks discount code use |
| `app/actions/admin.ts:112–120` | `parsed.plan === "starter"` → 50 product, 200 order check before recording payment |
| `app/actions/admin.ts:164–172` | `payment.targetPlan === "starter"` → same check before verifying payment |
| `lib/validations/products.ts:11` | Hardcoded `.max(5)` image cap |
| `components/dashboard/ProductForm.tsx:175,179,223,229,656` | Hardcoded `5 - images.length` image slot logic |
| `app/(marketing)/page.tsx` | Hardcoded pricing page with plan feature copy |
| `db/schema.ts:80,246,269` | `plan` column as raw text with comment `// starter \| growth` |
| `db/queries/merchants.ts:11`, `db/queries/admin.ts:70`, `app/actions/admin.ts:90` | TypeScript type `"starter" \| "growth"` — `"pro"` is missing |

> **Note:** The `"pro"` plan exists in the project overview (৳1499/month) but is absent from the codebase's TypeScript types. This unit fixes that omission.

---

## Database Schema

### 1. New table: `subscription_plans`

```typescript
// db/schema.ts — add this table
import { jsonb } from "drizzle-orm/pg-core"

export const subscriptionPlans = pgTable("subscription_plans", {
  id:         text("id").primaryKey(),
  name:       text("name").notNull(),           // e.g. "Starter"
  slug:       text("slug").notNull().unique(),   // e.g. "starter", "growth", "pro"
  pricePaisa: integer("price_paisa").notNull(),  // e.g. 49900 (৳499)
  isActive:   boolean("is_active").notNull().default(true),
  isArchived: boolean("is_archived").notNull().default(false),
  features:   jsonb("features")
                .$type<PlanFeatures>()
                .notNull(),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
  updatedAt:  timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("subscription_plans_slug_unique_idx").on(table.slug),
  index("subscription_plans_is_archived_idx").on(table.isArchived),
])
```

**`PlanFeatures` TypeScript interface** — define in `lib/plans/types.ts`:

```typescript
export interface PlanFeatures {
  // Numeric limits (null = unlimited)
  max_products:            number | null
  max_orders_per_month:    number | null
  max_categories:          number | null
  max_variants_per_product: number | null  // V2 Unit 21 — max variants per product (null = unlimited)

  // Image limits — see "Image & Variant Limit Semantics" section below
  max_images_per_product:  number | null   // applies to product-level gallery ONLY
  image_size_limit_mb:     number | null

  // Boolean feature flags
  discount_codes:          boolean
  telegram_notifications:  boolean
  cod:                     boolean  // Cash on Delivery (V2 Unit 23)
}
```

### 2. Modify: `subscriptions` table

Add a `planId` FK referencing `subscription_plans`. Keep the existing `plan` text column as a **denormalized snapshot** for historical display and fallback safety — do not remove it.

```typescript
// Add to subscriptions table in db/schema.ts:
planId: text("plan_id").references(() => subscriptionPlans.id, { onDelete: "set null" }),
```

> The `plan` (text) column continues to be set for backward compatibility and historical payment records. The new `planId` FK is the authoritative source for live limit resolution.

### 3. Modify: `subscriptionPayments` table

Add a `targetPlanId` FK alongside the existing `targetPlan` text column:

```typescript
// Add to subscriptionPayments table in db/schema.ts:
targetPlanId: text("target_plan_id").references(() => subscriptionPlans.id, { onDelete: "set null" }),
// Keep targetPlan text column as legacy snapshot — do not delete
```

### 4. Drizzle Relations additions

```typescript
export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(subscriptions),
  subscriptionPayments: many(subscriptionPayments),
}))

// Update subscriptionsRelations to include:
plan: one(subscriptionPlans, {
  fields: [subscriptions.planId],
  references: [subscriptionPlans.id],
})

// Update subscriptionPaymentsRelations to include:
targetPlan: one(subscriptionPlans, {
  fields: [subscriptionPayments.targetPlanId],
  references: [subscriptionPlans.id],
})
```

---

## Seed Migration

After generating the schema migration with `pnpm dlx drizzle-kit generate`, write a second migration SQL file that:

1. Inserts the 3 canonical plans:

```sql
INSERT INTO subscription_plans (id, name, slug, price_paisa, is_active, is_archived, features, created_at, updated_at)
VALUES
  (
    gen_random_uuid(), 'Starter', 'starter', 49900, true, false,
    '{"max_products":50,"max_orders_per_month":200,"max_categories":5,
      "max_variants_per_product":10,
      "max_images_per_product":2,"image_size_limit_mb":1,
      "discount_codes":false,"telegram_notifications":true,"cod":true}',
    now(), now()
  ),
  (
    gen_random_uuid(), 'Growth', 'growth', 99900, true, false,
    '{"max_products":100,"max_orders_per_month":500,"max_categories":15,
      "max_variants_per_product":30,
      "max_images_per_product":5,"image_size_limit_mb":2,
      "discount_codes":true,"telegram_notifications":true,"cod":true}',
    now(), now()
  ),
  (
    gen_random_uuid(), 'Pro', 'pro', 149900, true, false,
    '{"max_products":null,"max_orders_per_month":null,"max_categories":null,
      "max_variants_per_product":null,
      "max_images_per_product":5,"image_size_limit_mb":2,
      "discount_codes":true,"telegram_notifications":true,"cod":true}',
    now(), now()
  );
```

2. Backfills `subscriptions.plan_id`:

```sql
UPDATE subscriptions s
SET plan_id = sp.id
FROM subscription_plans sp
WHERE sp.slug = s.plan;
```

3. Backfills `subscription_payments.target_plan_id`:

```sql
UPDATE subscription_payments sp_pay
SET target_plan_id = sp_plan.id
FROM subscription_plans sp_plan
WHERE sp_plan.slug = sp_pay.target_plan;
```

> Run with `pnpm dlx drizzle-kit migrate` — do not run raw SQL manually.

---

## Image & Variant Limit Semantics (with V2 Unit 21)

This section clarifies exactly how `max_images_per_product` and `max_variants_per_product` apply once Product Variants (Unit 21) are introduced. These rules must be cross-referenced in the Unit 21 spec.

### `max_images_per_product` — product gallery only

`max_images_per_product` applies **only to the product-level gallery** (`product_images` table). It does **not** apply to variant images.

- **Variant images** are stored separately (a `variant_images` join table, introduced in Unit 21).
- Each variant may have **at most 1 image** — this is a flat rule, not plan-gated. Variant images serve as selection thumbnails ("pick the red one"), not a gallery.
- `image_size_limit_mb` applies universally to both product gallery uploads and variant image uploads.

**Example — Starter plan (`max_images_per_product: 2`):**

| Context | Limit |
|---------|-------|
| Product gallery | 2 images |
| Each variant image | 1 image (flat, not plan-gated) |
| Total possible images for a product with 6 variants | 2 (gallery) + 6 (variant selectors) = 8 |

The `assertPlanLimit` call for images targets the product gallery count only:

```typescript
// Server action: createProduct / updateProduct
await assertPlanLimit(
  merchantId,
  "max_images_per_product",
  galleryImages.length,   // count of product_images rows only — NOT variant images
  (limit) => `Your plan allows a maximum of ${limit} product gallery images.`
)
```

### `max_variants_per_product` — total combinations per product

`max_variants_per_product` is the maximum number of rows in `product_variants` for a single product (i.e., the total number of auto-generated SKU combinations).

- The limit is checked in the Unit 21 variant-save server action before inserting variant rows.
- For simple products (no variants), this limit is not checked.
- Defaults: Starter 10, Growth 30, Pro unlimited.

```typescript
// In the Unit 21 variant save server action:
await assertPlanLimit(
  merchantId,
  "max_variants_per_product",
  incomingVariants.length,
  (limit) => `Your plan allows a maximum of ${limit} variants per product.`
)
```

**Rationale for defaults:**
- Starter (10): covers a single size dimension (S/M/L/XL/XXL × 2 colors)
- Growth (30): covers a full size × color matrix (5 sizes × 6 colors)
- Pro (unlimited): no restriction

---

## New Shared Utility: `lib/plans/`

Create `lib/plans/` with the following files. This is the **single entry point** for all plan checks.

### `lib/plans/types.ts`

The `PlanFeatures` interface (as above). Also export:

```typescript
export interface ResolvedPlan {
  id: string
  name: string
  slug: string
  pricePaisa: number
  features: PlanFeatures
}
```

### `lib/plans/getPlan.ts`

```typescript
import { cache } from "react"
import { db } from "@/db"
import { subscriptions, subscriptionPlans, merchants } from "@/db/schema"
import { eq } from "drizzle-orm"
import type { ResolvedPlan } from "./types"

/**
 * Returns the effective plan for a merchant.
 * Uses React.cache() for per-request deduplication (Invariant: no duplicate DB calls).
 *
 * Resolution order:
 *   1. subscription.plan_id → subscription_plans row  (preferred)
 *   2. Fallback: match subscription_plans.slug = merchants.plan  (legacy)
 */
export const getMerchantPlan = cache(async (merchantId: string): Promise<ResolvedPlan | null> => {
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.merchantId, merchantId),
    with: { plan: true },
  })

  if (subscription?.plan) {
    const p = subscription.plan
    return { id: p.id, name: p.name, slug: p.slug, pricePaisa: p.pricePaisa, features: p.features }
  }

  // Legacy fallback: merchant.plan text → slug lookup
  const merchant = await db.query.merchants.findFirst({
    where: eq(merchants.id, merchantId),
  })
  if (!merchant) return null

  const legacyPlan = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.slug, merchant.plan),
  })

  return legacyPlan
    ? { id: legacyPlan.id, name: legacyPlan.name, slug: legacyPlan.slug, pricePaisa: legacyPlan.pricePaisa, features: legacyPlan.features }
    : null
})
```

### `lib/plans/assertPlan.ts`

```typescript
import { getMerchantPlan } from "./getPlan"
import type { PlanFeatures } from "./types"

/**
 * Throws if a boolean feature is not enabled on the merchant's plan.
 * Use for: discount_codes, cod, telegram_notifications.
 */
export async function assertPlanFeature(
  merchantId: string,
  feature: keyof Pick<PlanFeatures, "discount_codes" | "cod" | "telegram_notifications">,
  errorMessage: string
) {
  const plan = await getMerchantPlan(merchantId)
  if (!plan || !plan.features[feature]) {
    throw new Error(errorMessage)
  }
}

/**
 * Throws if the merchant has reached or exceeded a numeric plan limit.
 * Passes silently when limit is null (unlimited).
 */
export async function assertPlanLimit(
  merchantId: string,
  limitKey: keyof Pick<PlanFeatures,
    "max_products" | "max_orders_per_month" | "max_categories" | "max_images_per_product" | "max_variants_per_product"
  >,
  currentCount: number,
  buildErrorMessage: (limit: number) => string
) {
  const plan = await getMerchantPlan(merchantId)
  const limit = plan?.features[limitKey] ?? null
  if (limit !== null && currentCount >= limit) {
    throw new Error(buildErrorMessage(limit))
  }
}
```

---

## Refactoring Existing Limit Checks

Replace every hardcoded plan check with `assertPlanLimit` / `assertPlanFeature`. The query function signatures remain unchanged — only the guard logic inside them changes.

### `db/queries/products.ts` — product count guard

```typescript
// BEFORE:
if (merchant.plan === "starter") {
  const [result] = await db.select({ value: count() })...
  if (result && result.value >= 50) throw new Error("Plan Limit Exceeded: Starter plan is limited to 50 products.")
}

// AFTER (remove merchant fetch, use assertPlanLimit):
const [countResult] = await db
  .select({ value: count() })
  .from(products)
  .where(and(eq(products.merchantId, merchantId), isNull(products.deletedAt)))

await assertPlanLimit(
  merchantId,
  "max_products",
  countResult?.value ?? 0,
  (limit) => `Plan Limit Exceeded: Your plan allows a maximum of ${limit} active products.`
)
```

### `db/queries/categories.ts` — category count guard

```typescript
// AFTER (replace the starter/growth if-chain entirely):
await assertPlanLimit(
  merchantId,
  "max_categories",
  existingCount,
  (limit) => `Plan Limit Exceeded: Your plan allows a maximum of ${limit} categories.`
)
```

### `db/queries/orders.ts` — monthly order count guard

```typescript
// AFTER:
await assertPlanLimit(
  merchantId,
  "max_orders_per_month",
  monthlyOrderCount,
  (limit) => `This store has reached its monthly order limit of ${limit} orders. Please contact the store owner.`
)
```

### `app/actions/discounts.ts` — discount codes feature flag

```typescript
// Replace assertGrowthPlan() call with:
import { assertPlanFeature } from "@/lib/plans/assertPlan"

await assertPlanFeature(
  merchantId,
  "discount_codes",
  "Discount codes are not available on your current plan. Upgrade to access this feature."
)
```

### `app/actions/admin.ts` — plan checks before payment recording/verification

Replace hardcoded `parsed.plan === "starter"` / `payment.targetPlan === "starter"` checks. The admin actions accept `targetPlanId` (a plan UUID) instead of the hardcoded string slug:

```typescript
// 1. Change input schema:
//    plan: z.enum(["starter", "growth"])  →  targetPlanId: z.string().min(1)

// 2. Fetch plan from DB:
const targetPlan = await db.query.subscriptionPlans.findFirst({
  where: eq(subscriptionPlans.id, parsed.targetPlanId),
})
if (!targetPlan) throw new Error("Plan not found.")

// 3. Dynamic limit check (replaces if (parsed.plan === "starter") { ... }):
const limits = targetPlan.features
if (limits.max_products !== null && counts.productsCount > limits.max_products) {
  throw new Error(`Cannot record payment: Boutique has ${counts.productsCount} products, which exceeds the ${targetPlan.name} plan limit of ${limits.max_products}.`)
}
if (limits.max_orders_per_month !== null && counts.monthlyOrdersCount > limits.max_orders_per_month) {
  throw new Error(`Cannot record payment: Boutique has ${counts.monthlyOrdersCount} orders this month, which exceeds the ${targetPlan.name} plan limit of ${limits.max_orders_per_month}.`)
}
```

### `components/dashboard/ProductForm.tsx` — image slots

Replace hardcoded `5 - images.length` with plan-driven values passed as props:

```typescript
// ProductForm now accepts (add to existing props interface):
interface ProductFormProps {
  // ... existing props
  maxImages: number          // e.g. 2 for Starter, 5 for Growth/Pro
  imageSizeLimitMb: number   // e.g. 1 for Starter, 2 for Growth/Pro
}

// Replace every: const availableSlots = 5 - images.length
// With:          const availableSlots = maxImages - images.length

// Replace every: "You can only upload up to 5 images..."
// With:          `You can only upload up to ${maxImages} images...`
```

Parent pages (`new/page.tsx` and `edit/[id]/page.tsx`) fetch plan server-side and pass props:

```typescript
// In the Server Component page:
import { getMerchantPlan } from "@/lib/plans/getPlan"

const plan = await getMerchantPlan(merchantId)
const maxImages = plan?.features.max_images_per_product ?? 5
const imageSizeLimitMb = plan?.features.image_size_limit_mb ?? 2

return <ProductForm maxImages={maxImages} imageSizeLimitMb={imageSizeLimitMb} ... />
```

### `lib/validations/products.ts` — image count Zod schema

Remove the hardcoded `.max(5)` — count is enforced server-side in the action:

```typescript
// BEFORE:
images: z.array(z.string()).max(5, "You can upload up to 5 images only."),

// AFTER:
images: z.array(z.string()),
// Count validated server-side in the createProduct / updateProduct action
// after calling getMerchantPlan().
```

---

## Next.js Configuration

To enable the `'use cache'` directive and related cache APIs (`cacheTag`, `cacheLife`), you must enable the `cacheComponents` flag in `next.config.ts`:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  // ... other configs
}
```

---

## New DB Queries: `db/queries/plans.ts`

```typescript
import { db } from "@/db"
import { subscriptionPlans } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import type { PlanFeatures } from "@/lib/plans/types"
import { cacheTag, cacheLife } from "next/cache"

/** Get all non-archived plans, ordered by price ascending. Used on marketing + onboarding pages. */
export async function getAllPlans() {
  'use cache'
  cacheTag("subscription-plans")
  cacheLife("days")
  return await db.query.subscriptionPlans.findMany({
    where: eq(subscriptionPlans.isArchived, false),
    orderBy: [asc(subscriptionPlans.pricePaisa)],
  })
}

/** Get all plans including archived ones — super admin only, no cache. */
export async function getAllPlansAdmin() {
  return await db.query.subscriptionPlans.findMany({
    orderBy: [asc(subscriptionPlans.pricePaisa)],
  })
}

/** Get a single plan by ID. */
export async function getPlanById(planId: string) {
  return await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.id, planId),
  })
}

/** Create a new plan. */
export async function createPlan(data: {
  name: string; slug: string; pricePaisa: number; features: PlanFeatures
}) {
  const [plan] = await db.insert(subscriptionPlans)
    .values({ id: crypto.randomUUID(), ...data, isActive: true, isArchived: false })
    .returning()
  return plan
}

/** Update a plan's editable fields. Slug is excluded — it is immutable after creation. */
export async function updatePlan(planId: string, data: {
  name?: string; pricePaisa?: number; features?: PlanFeatures
}) {
  const [plan] = await db.update(subscriptionPlans)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(subscriptionPlans.id, planId))
    .returning()
  return plan
}

/** Soft-delete a plan. Merchants on this plan retain access; it is hidden from the onboarding picker. */
export async function archivePlan(planId: string) {
  const [plan] = await db.update(subscriptionPlans)
    .set({ isArchived: true, isActive: false, updatedAt: new Date() })
    .where(eq(subscriptionPlans.id, planId))
    .returning()
  return plan
}

/** Restore a previously archived plan. */
export async function unarchivePlan(planId: string) {
  const [plan] = await db.update(subscriptionPlans)
    .set({ isArchived: false, isActive: true, updatedAt: new Date() })
    .where(eq(subscriptionPlans.id, planId))
    .returning()
  return plan
}
```

---

## Super Admin UI: Plans Management

Add a **"Plans"** section to the super admin panel.

### Route structure

```
app/(admin)/admin/plans/
  page.tsx           ← plan list (Server Component)
  new/
    page.tsx         ← create plan form
  [planId]/
    page.tsx         ← edit plan form
```

### `page.tsx` — Plan List

A Server Component table. Columns:

| Column | Notes |
|--------|-------|
| Name | Plan display name |
| Slug | Immutable (`starter`, `growth`, `pro`, custom) |
| Price | `৳XXX/month` |
| Products | `max_products` or "Unlimited" |
| Orders/Month | `max_orders_per_month` or "Unlimited" |
| Categories | `max_categories` or "Unlimited" |
| Images | `max_images_per_product` |
| Image Size | `image_size_limit_mb MB` |
| Discount Codes | ✓ / ✗ Badge |
| COD | ✓ / ✗ Badge |
| Status | Active / Archived Badge |
| Actions | Edit button, Archive/Unarchive button |

- Archived rows render with muted opacity + `Archived` badge.
- A **"+ New Plan"** primary button in the page header links to `/admin/plans/new`.
- Archive button is disabled (with `Tooltip`: "Merchants are currently on this plan") if any `subscriptions.plan_id` references this plan and `status` is `trial | active`.

### Plan Form (`PlanForm` client component)

Used by both `new/page.tsx` and `[planId]/page.tsx`. Accepts `initialValues` prop (undefined = create mode).

**Fields:**

```
Name              [Input]           Required. e.g. "Enterprise"
Slug              [Input]           Auto-generated from name (kebab-case). Editable on create.
                                    Disabled + tooltip on edit: "Slug cannot be changed after creation."
Price (৳/month)   [NumberInput]     Required. Stored as paisa (UI shows ৳ value, action multiplies ×100).
```

**Feature Limits section** (group label: "Plan Limits"):

Each numeric limit row has an `[Input type=number]` and an "Unlimited" `[Checkbox]`:
- When Unlimited is checked → input is disabled, value submitted as `null`.
- When Unlimited is unchecked → input is required and must be a positive integer.

```
Max Products           [NumberInput]  [☐ Unlimited]
Max Orders/Month       [NumberInput]  [☐ Unlimited]
Max Categories         [NumberInput]  [☐ Unlimited]
Max Variants/Product   [NumberInput]  [☐ Unlimited]   ← new (V2 Unit 21)
Max Gallery Images/Product [NumberInput]  (no unlimited — must be a real number)
                           Note: applies to product-level gallery only.
                           Variant images are always 1 per variant, not plan-gated.
Image Size Limit (MB)  [NumberInput]  (no unlimited option)
```

**Feature Flags section** (group label: "Features"):

```
[☐] Discount Codes
[☐] Cash on Delivery (COD)
[☐] Telegram Notifications
```

**Submit**: "Create Plan" (create mode) / "Save Changes" (edit mode).

### Zod Validation: `lib/validations/plans.ts`

```typescript
import { z } from "zod"

export const planFeaturesSchema = z.object({
  max_products:             z.number().int().positive().nullable(),
  max_orders_per_month:     z.number().int().positive().nullable(),
  max_categories:           z.number().int().positive().nullable(),
  max_variants_per_product: z.number().int().positive().nullable(),
  max_images_per_product:   z.number().int().positive(),  // product gallery only
  image_size_limit_mb:      z.number().positive(),
  discount_codes:           z.boolean(),
  telegram_notifications:   z.boolean(),
  cod:                      z.boolean(),
})

export const planFormSchema = z.object({
  name:       z.string().min(2, "Name must be at least 2 characters"),
  slug:       z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  pricePaisa: z.number().int().nonnegative("Price cannot be negative"),
  features:   planFeaturesSchema,
})

export type PlanFormValues = z.infer<typeof planFormSchema>
```

### Server Actions: `app/actions/plans.ts`

All actions require `assertAdmin()` first.

```typescript
export async function createPlanAction(data: PlanFormValues): Promise<{ success: boolean; error?: string }>
export async function updatePlanAction(planId: string, data: Partial<PlanFormValues>): Promise<{ success: boolean; error?: string }>
export async function archivePlanAction(planId: string): Promise<{ success: boolean; error?: string }>
export async function unarchivePlanAction(planId: string): Promise<{ success: boolean; error?: string }>
```

Each action:
1. Calls `assertAdmin()`.
2. Parses input via `planFormSchema.safeParse()` — returns `error.issues[0].message` on failure.
3. Calls the corresponding query from `db/queries/plans.ts`.
4. Calls `revalidateTag("subscription-plans")` and `revalidatePath("/admin/plans")`.
5. Returns `{ success: true }` or `{ success: false, error: message }`.

---

## Navigation Update

Add "Plans" to the super admin sidebar/nav component alongside Merchants and Subscriptions:

```
/admin/plans → "Plans"  (icon: LayoutList or CreditCard from Lucide)
```

---

## Onboarding Plan Picker Update

`app/(auth)/onboarding/` — replace hardcoded plan cards with dynamic fetch:

```typescript
// In the Server Component:
import { getAllPlans } from "@/db/queries/plans"

const plans = await getAllPlans()
// Render plan cards from plans[] dynamically
// "Unlimited" for null values; ৳ price from pricePaisa / 100
// Submit planId (UUID) in the onboarding form — stored in subscriptions.plan_id
```

---

## Marketing Page Update

`app/(marketing)/page.tsx` — replace hardcoded pricing section:

```typescript
import { getAllPlans } from "@/db/queries/plans"

// In the Server Component (already cached inside getAllPlans via 'use cache'):
const plans = await getAllPlans()
// Render plan cards dynamically
```

---

## TypeScript Type Cleanup

Remove all `"starter" | "growth"` union types. Replace with `string`:

| File | Change |
|------|--------|
| `db/queries/merchants.ts:11` | `plan: "starter" \| "growth"` → `plan: string` |
| `db/queries/admin.ts:70` | same |
| `app/actions/admin.ts:90` | `plan: "starter" \| "growth"` → `planId: string` |
| `app/actions/admin.ts:102` | `z.enum(["starter", "growth"])` → `z.string().min(1)` |

---

## Dependencies

No new packages required. All capabilities exist in the current stack:
- `drizzle-orm/pg-core` — `jsonb()` column type (already in schema imports)
- `react` — `cache()` for deduplication (Unit 18 already established this pattern)
- `zod` v4 — schema validation (already installed)
- TanStack Form v1 — plan form (already installed)
- `next/cache` — `cacheTag`, `cacheLife`, `revalidateTag` (already in use)

---

## Verification Checklist

### Database
- [ ] `subscription_plans` table exists with all columns after running migrations
- [ ] Seeder inserted 3 rows: `starter` (৳499), `growth` (৳999), `pro` (৳1499)
- [ ] All existing `subscriptions` rows have `plan_id` correctly backfilled
- [ ] All existing `subscription_payments` rows have `target_plan_id` correctly backfilled
- [ ] `subscription_plans.slug` unique index is enforced (duplicate slug insert fails)
- [ ] `features` JSONB stores and retrieves typed data correctly (no double-serialization)
- [ ] `null` values in JSONB features round-trip correctly (unlimited flags)

### Plan Resolution (`lib/plans/`)
- [ ] `getMerchantPlan()` returns correct plan when `subscriptions.plan_id` is set
- [ ] `getMerchantPlan()` falls back to `merchants.plan` text slug match when `plan_id` is null
- [ ] `getMerchantPlan()` is deduped via `React.cache()` — two calls in the same request = one DB query
- [ ] `getMerchantPlan()` returns `null` for a merchant with no matching plan record
- [ ] `assertPlanLimit()` throws for a count at or above the limit
- [ ] `assertPlanLimit()` does NOT throw when the limit is `null` (unlimited)
- [ ] `assertPlanFeature()` throws when the feature flag is `false`

### Limit Enforcement (Regression Check)
- [ ] Creating a product beyond `max_products` throws a user-facing error (not a 500)
- [ ] Creating a category beyond `max_categories` throws a user-facing error
- [ ] Placing an order beyond `max_orders_per_month` throws a user-facing error
- [ ] Creating a discount code when `discount_codes: false` is blocked server-side
- [ ] Uploading more images than `max_images_per_product` is blocked in the server action
- [ ] Pro plan (all `null` limits, all feature flags `true`) — none of the above checks throw
- [ ] Starter plan (2 images max) — `ProductForm` renders 2 image slots; server action rejects a 3rd image

### Super Admin Plans UI
- [ ] `/admin/plans` renders a table of all plans including archived
- [ ] Creating a new plan saves to DB, invalidates cache, and appears in the table immediately
- [ ] Editing a plan's name, price, or feature flags persists correctly
- [ ] Slug field is disabled (with tooltip) on the edit form
- [ ] "Unlimited" checkbox sets `null` in the JSONB; table renders "Unlimited"
- [ ] Archiving a plan shows the `Archived` badge and removes it from the onboarding picker
- [ ] Unarchiving a plan restores it to the onboarding picker
- [ ] Archive button is disabled when active merchant subscriptions reference the plan
- [ ] `revalidateTag("subscription-plans")` fires on create/edit/archive — marketing page reflects changes within one next request

### Onboarding & Marketing Page
- [ ] Onboarding plan picker renders dynamically from DB (no hardcoded plan data)
- [ ] Marketing pricing section renders dynamically from DB
- [ ] A new plan created in the admin panel appears on the onboarding picker after cache revalidation
- [ ] `null` feature limits display as "Unlimited" in both onboarding and marketing views

### TypeScript
- [ ] No `"starter" | "growth"` union types remain in `db/queries/`, `app/actions/`
- [ ] `PlanFeatures` interface is the single source of truth — no duplicate feature-flag definitions
- [ ] `ResolvedPlan` type is used wherever plan data is consumed downstream
- [ ] `pnpm tsc --noEmit` passes with zero errors after all changes
