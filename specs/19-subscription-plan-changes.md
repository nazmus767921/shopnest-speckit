# Spec 19: Subscription Plan Changes

## Goal

Implement safe, merchant-transparent plan change logic: instant plan-switching by the admin, hard downgrade blocking when a merchant's current resource usage exceeds the target plan's limits, grandfathered limit snapshots so existing subscribers are not retroactively affected by plan-config edits, and an automated Resend email to the merchant whenever their plan is changed.

---

## Context: Current State

After Unit 18, the `subscriptions` table holds a `plan_id` FK pointing to a `subscription_plans` row. All limit enforcement reads from the live `subscription_plans.features` JSONB at request time via `getMerchantPlan()` in `lib/plans/getPlan.ts`.

**Problem:** If the super admin edits a plan's feature limits (e.g. reduces Growth `max_products` from 100 → 50), all Growth subscribers are immediately affected — even merchants who already paid for 3 months under the old limits. There is also no formal "plan change" action (distinct from payment recording) that validates downgrade safety, updates the subscription, and notifies the merchant.

**This unit adds:**

1. `snapshot_*` columns to `subscriptions` so per-subscriber limits are locked at activation time.
2. A dedicated `changeMerchantPlanAction` server action with downgrade-block validation.
3. An admin UI trigger for plan changes (separate from payment recording).
4. A `plan_changed` Resend email notification to the merchant.
5. Updated `getMerchantPlan()` to read from snapshot columns, not the live plan.

---

## Database Schema

### 1. Modify: `subscriptions` table

Add snapshot columns to lock in the limits the merchant agreed to when they subscribed:

```typescript
// db/schema.ts — add to subscriptions table
snapshotProductLimit:     integer("snapshot_product_limit"),       // null = unlimited
snapshotCategoryLimit:    integer("snapshot_category_limit"),      // null = unlimited
snapshotDiscountLimit:    integer("snapshot_discount_limit"),      // null = unlimited; 0 = feature off
snapshotImagesPerProduct: integer("snapshot_images_per_product"),  // must be a real number
snapshotImageSizeMb:      integer("snapshot_image_size_mb"),       // MB integer
snapshotOrdersPerMonth:   integer("snapshot_orders_per_month"),    // null = unlimited
```

> **Null semantics:** `null` means unlimited (mirrors `PlanFeatures` — `number | null`). `0` on `snapshot_discount_limit` means discount codes are not available on this plan (mirrors `discount_codes: false` feature flag).

### 2. Updated `subscriptions` table shape (after migration)

```typescript
export const subscriptions = pgTable("subscriptions", {
  id:                     text("id").primaryKey(),
  merchantId:             text("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  plan:                   text("plan").notNull().default("starter"),  // legacy text snapshot
  planId:                 text("plan_id").references(() => subscriptionPlans.id, { onDelete: "set null" }),
  status:                 text("status").notNull().default("trial"),
  currentPeriodStart:     timestamp("current_period_start"),
  currentPeriodEnd:       timestamp("current_period_end"),
  // ── Limit Snapshot ─────────────────────────────────────────────
  snapshotProductLimit:   integer("snapshot_product_limit"),
  snapshotCategoryLimit:  integer("snapshot_category_limit"),
  snapshotDiscountLimit:  integer("snapshot_discount_limit"),
  snapshotImagesPerProduct: integer("snapshot_images_per_product"),
  snapshotImageSizeMb:    integer("snapshot_image_size_mb"),
  snapshotOrdersPerMonth: integer("snapshot_orders_per_month"),
  // ───────────────────────────────────────────────────────────────
  createdAt:              timestamp("created_at").notNull().defaultNow(),
  updatedAt:              timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("subscriptions_merchant_id_idx").on(table.merchantId),
  index("subscriptions_status_idx").on(table.status),
]).enableRLS()
```

### 3. Migration strategy

Generate with `pnpm dlx drizzle-kit generate`. After running `pnpm dlx drizzle-kit migrate`, write a **manual seed migration SQL** to backfill snapshot values for all existing subscription rows:

```sql
-- Backfill snapshot columns for existing subscriptions
UPDATE subscriptions s
SET
  snapshot_product_limit      = (sp.features->>'max_products')::integer,
  snapshot_category_limit     = (sp.features->>'max_categories')::integer,
  snapshot_discount_limit     = CASE
    WHEN (sp.features->>'discount_codes')::boolean = true THEN null
    ELSE 0
  END,
  snapshot_images_per_product = (sp.features->>'max_images_per_product')::integer,
  snapshot_image_size_mb      = (sp.features->>'image_size_limit_mb')::integer,
  snapshot_orders_per_month   = (sp.features->>'max_orders_per_month')::integer
FROM subscription_plans sp
WHERE sp.id = s.plan_id;
```

---

## Limit Resolution: Updated `lib/plans/getPlan.ts`

After this unit, `getMerchantPlan()` must return limits from the **subscription snapshot**, not from the live plan's `features` JSONB. The live plan features are now used only to populate the snapshot.

### Updated `ResolvedPlan` type (`lib/plans/types.ts`)

```typescript
export interface ResolvedPlan {
  id: string
  name: string
  slug: string
  pricePaisa: number
  // Effective limits — always sourced from subscription snapshot when available
  features: PlanFeatures
  // True if limits came from a snapshot (merchant is grandfathered)
  isGrandfathered: boolean
}
```

### Updated `getMerchantPlan()` resolution logic

```typescript
export const getMerchantPlan = cache(async (merchantId: string): Promise<ResolvedPlan | null> => {
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.merchantId, merchantId),
    with: { plan: true },
  })

  if (subscription) {
    const livePlan = subscription.plan  // may be null if plan was archived/deleted

    // Build effective features from snapshot columns (grandfathered limits)
    const hasSnapshot = subscription.snapshotProductLimit !== null
      || subscription.snapshotOrdersPerMonth !== null
      || subscription.snapshotImagesPerProduct !== null

    if (hasSnapshot && livePlan) {
      const snapshotFeatures: PlanFeatures = {
        max_products:             subscription.snapshotProductLimit ?? null,
        max_orders_per_month:     subscription.snapshotOrdersPerMonth ?? null,
        max_categories:           subscription.snapshotCategoryLimit ?? null,
        max_images_per_product:   subscription.snapshotImagesPerProduct ?? livePlan.features.max_images_per_product,
        image_size_limit_mb:      subscription.snapshotImageSizeMb ?? livePlan.features.image_size_limit_mb,
        max_variants_per_product: livePlan.features.max_variants_per_product, // not snapshot-tracked yet
        discount_codes:           subscription.snapshotDiscountLimit !== 0, // 0 = disabled
        telegram_notifications:   livePlan.features.telegram_notifications,
        cod:                      livePlan.features.cod,
      }
      return {
        id: livePlan.id,
        name: livePlan.name,
        slug: livePlan.slug,
        pricePaisa: livePlan.pricePaisa,
        features: snapshotFeatures,
        isGrandfathered: true,
      }
    }

    if (livePlan) {
      return {
        id: livePlan.id,
        name: livePlan.name,
        slug: livePlan.slug,
        pricePaisa: livePlan.pricePaisa,
        features: livePlan.features,
        isGrandfathered: false,
      }
    }
  }

  // Legacy fallback: merchants.plan text slug → plan lookup
  const merchant = await db.query.merchants.findFirst({
    where: eq(merchants.id, merchantId),
  })
  if (!merchant) return null

  const legacyPlan = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.slug, merchant.plan),
  })

  return legacyPlan
    ? { id: legacyPlan.id, name: legacyPlan.name, slug: legacyPlan.slug, pricePaisa: legacyPlan.pricePaisa, features: legacyPlan.features, isGrandfathered: false }
    : null
})
```

### When snapshot is written / refreshed

The helper `writeSubscriptionSnapshot(merchantId, planId)` in `db/queries/subscriptions.ts` is called in three places only:

| Trigger | Action |
|---------|--------|
| Initial subscription activation (trial → active, via payment verification) | Write snapshot from plan |
| Admin changes merchant's plan (this unit's new action) | Write snapshot from new plan |
| Subscription renewal (admin verifies multi-month payment) | Refresh snapshot from plan's current limits |

**Plan config edit** (`updatePlanAction` from Unit 18) does **not** call `writeSubscriptionSnapshot` — that is the entire point of the grandfathering system.

---

## New DB Query: `writeSubscriptionSnapshot`

Add to `db/queries/subscriptions.ts`:

```typescript
import { subscriptions, subscriptionPlans } from "@/db/schema"
import type { PlanFeatures } from "@/lib/plans/types"

/**
 * Writes or refreshes the limit snapshot on a merchant's subscription row.
 * Called when a subscription is activated, upgraded, switched, or renewed.
 * NOT called when a plan's config is edited — snapshot preserves grandfathered limits.
 */
export async function writeSubscriptionSnapshot(
  merchantId: string,
  planFeatures: PlanFeatures
) {
  await db
    .update(subscriptions)
    .set({
      snapshotProductLimit:     planFeatures.max_products,
      snapshotCategoryLimit:    planFeatures.max_categories,
      snapshotDiscountLimit:    planFeatures.discount_codes ? null : 0,
      snapshotImagesPerProduct: planFeatures.max_images_per_product,
      snapshotImageSizeMb:      planFeatures.image_size_limit_mb,
      snapshotOrdersPerMonth:   planFeatures.max_orders_per_month,
      updatedAt:                new Date(),
    })
    .where(eq(subscriptions.merchantId, merchantId))
}
```

Also add to `db/queries/subscriptions.ts`:

```typescript
/**
 * Full resource usage counts for downgrade validation.
 * Extends the existing getMerchantUsageCounts() with categories and discount codes.
 */
export async function getMerchantFullUsageCounts(merchantId: string) {
  const [productCountResult] = await db
    .select({ value: count() })
    .from(products)
    .where(and(eq(products.merchantId, merchantId), isNull(products.deletedAt)))

  const [categoryCountResult] = await db
    .select({ value: count() })
    .from(categories)
    .where(eq(categories.merchantId, merchantId))

  const [discountCountResult] = await db
    .select({ value: count() })
    .from(discountCodes)
    .where(eq(discountCodes.merchantId, merchantId))

  // Max images on any single product (to check images-per-product violation)
  const imageCountsRaw = await db
    .select({ productId: productImages.productId, cnt: count() })
    .from(productImages)
    .where(eq(productImages.merchantId, merchantId))
    .groupBy(productImages.productId)
  const maxImagesOnAnyProduct = imageCountsRaw.reduce((max, row) => Math.max(max, row.cnt), 0)

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [orderCountResult] = await db
    .select({ value: count() })
    .from(orders)
    .where(and(eq(orders.merchantId, merchantId), gte(orders.createdAt, startOfMonth), ne(orders.status, "draft")))

  return {
    productsCount:          productCountResult?.value ?? 0,
    categoriesCount:        categoryCountResult?.value ?? 0,
    discountCodesCount:     discountCountResult?.value ?? 0,
    maxImagesOnAnyProduct:  maxImagesOnAnyProduct,
    monthlyOrdersCount:     orderCountResult?.value ?? 0,
  }
}
```

---

## Downgrade Validation

All validation happens in a shared helper called from the server action:

### `lib/plans/validateDowngrade.ts`

```typescript
import type { PlanFeatures } from "./types"

export interface DowngradeViolation {
  field: string
  message: string
}

/**
 * Compares current merchant resource counts against a target plan's limits.
 * Returns an array of per-resource violation messages.
 * An empty array means the downgrade is safe.
 */
export function validateDowngrade(
  currentCounts: {
    productsCount: number
    categoriesCount: number
    discountCodesCount: number
    maxImagesOnAnyProduct: number
    monthlyOrdersCount: number
  },
  targetPlanFeatures: PlanFeatures,
  targetPlanName: string
): DowngradeViolation[] {
  const violations: DowngradeViolation[] = []

  if (
    targetPlanFeatures.max_products !== null &&
    currentCounts.productsCount > targetPlanFeatures.max_products
  ) {
    violations.push({
      field: "products",
      message: `You have ${currentCounts.productsCount} active products, but the ${targetPlanName} plan allows a maximum of ${targetPlanFeatures.max_products}. Please delete or deactivate products before downgrading.`,
    })
  }

  if (
    targetPlanFeatures.max_categories !== null &&
    currentCounts.categoriesCount > targetPlanFeatures.max_categories
  ) {
    violations.push({
      field: "categories",
      message: `You have ${currentCounts.categoriesCount} categories, but the ${targetPlanName} plan allows a maximum of ${targetPlanFeatures.max_categories}. Please delete categories before downgrading.`,
    })
  }

  if (
    !targetPlanFeatures.discount_codes &&
    currentCounts.discountCodesCount > 0
  ) {
    violations.push({
      field: "discountCodes",
      message: `You have ${currentCounts.discountCodesCount} active discount codes, but the ${targetPlanName} plan does not include discount codes. Please delete all discount codes before downgrading.`,
    })
  }

  if (
    targetPlanFeatures.max_images_per_product !== null &&
    currentCounts.maxImagesOnAnyProduct > targetPlanFeatures.max_images_per_product
  ) {
    violations.push({
      field: "imagesPerProduct",
      message: `One or more of your products has more images than the ${targetPlanName} plan allows (max ${targetPlanFeatures.max_images_per_product} per product). Please reduce product images before downgrading.`,
    })
  }

  return violations
}
```

**Note:** Monthly order count is **not** a downgrade blocker. Orders are historical records; the merchant cannot delete them to satisfy a limit. Only configurable resources (products, categories, discount codes, images) are checked.

---

## Server Action: `changeMerchantPlanAction`

Add to `app/actions/admin.ts`:

```typescript
/**
 * Change a merchant's subscription plan instantly.
 * - Blocks downgrade if current resource counts exceed the target plan's limits.
 * - Writes snapshot columns on success.
 * - Sends a plan_changed email to the merchant's registered email.
 */
export async function changeMerchantPlanAction(params: {
  merchantId: string
  targetPlanId: string
}): Promise<{ success: boolean; errors?: DowngradeViolation[]; error?: string }> {
  try {
    await assertAdmin()

    const schema = z.object({
      merchantId:   z.string().min(1),
      targetPlanId: z.string().min(1),
    })
    const parsed = schema.parse(params)

    // 1. Fetch target plan
    const targetPlan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, parsed.targetPlanId),
    })
    if (!targetPlan) throw new Error("Target plan not found.")
    if (targetPlan.isArchived) throw new Error("Cannot assign an archived plan to a merchant.")

    // 2. Get full merchant resource counts
    const { getMerchantFullUsageCounts } = await import("@/db/queries/subscriptions")
    const counts = await getMerchantFullUsageCounts(parsed.merchantId)

    // 3. Downgrade validation — get current plan to check direction
    const { getMerchantPlan } = await import("@/lib/plans/getPlan")
    const currentPlan = await getMerchantPlan(parsed.merchantId)
    const isDowngrade =
      currentPlan !== null &&
      targetPlan.pricePaisa < currentPlan.pricePaisa

    if (isDowngrade) {
      const { validateDowngrade } = await import("@/lib/plans/validateDowngrade")
      const violations = validateDowngrade(counts, targetPlan.features, targetPlan.name)
      if (violations.length > 0) {
        return { success: false, errors: violations }
      }
    }

    // 4. Update subscription: plan_id, plan slug (legacy), and snapshot
    const { writeSubscriptionSnapshot } = await import("@/db/queries/subscriptions")

    await db
      .update(subscriptions)
      .set({
        planId:    targetPlan.id,
        plan:      targetPlan.slug,   // keep legacy text column in sync
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.merchantId, parsed.merchantId))

    await writeSubscriptionSnapshot(parsed.merchantId, targetPlan.features)

    // 5. Also sync merchants.plan for legacy fallback consistency
    await db
      .update(merchants)
      .set({ plan: targetPlan.slug })
      .where(eq(merchants.id, parsed.merchantId))

    // 6. Send plan_changed email to merchant (fire-and-forget — Invariant 6)
    sendPlanChangedEmail({
      merchantId: parsed.merchantId,
      newPlanName: targetPlan.name,
      features: targetPlan.features,
      pricePaisa: targetPlan.pricePaisa,
    }).catch((err) => {
      console.error("[changeMerchantPlanAction] Failed to send plan_changed email:", err)
    })

    revalidatePath("/admin/merchants")
    revalidatePath("/admin/subscriptions")
    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to change merchant plan." }
  }
}
```

---

## Email: `plan_changed` Notification

### `lib/email.ts` — new `sendPlanChangedEmail` function

Add alongside the existing `sendEmail` helper. This function is **not** tied to an `order_id` — it uses the merchant's registered email, not a customer email. The `email_logs` table's `order_id` column is NOT NULL in the current schema; we need to update the log to be nullable **or** use a sentinel value.

**Decision:** Pass a sentinel `order_id` of `"plan_change"` for logging purposes, **and** update `email_logs.order_id` to nullable in the schema migration.

#### Schema change — `email_logs` table

```typescript
// db/schema.ts — make orderId nullable on email_logs
orderId: text("order_id").references(() => orders.id, { onDelete: "cascade" }),
// Change to:
orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
// And remove .notNull()
```

#### `sendPlanChangedEmail` function

```typescript
// lib/email.ts — add:

export async function sendPlanChangedEmail(params: {
  merchantId: string
  newPlanName: string
  features: PlanFeatures
  pricePaisa: number
}): Promise<void> {
  // Fetch merchant user email from DB
  const { db } = await import("@/db")
  const { merchants, user } = await import("@/db/schema")
  const { eq } = await import("drizzle-orm")

  const merchant = await db.query.merchants.findFirst({
    where: eq(merchants.id, params.merchantId),
    with: { owner: true }, // requires merchantsRelations to include owner
  })

  if (!merchant?.owner?.email) {
    console.error("[sendPlanChangedEmail] Could not find merchant email for", params.merchantId)
    return
  }

  const priceTaka = Math.round(params.pricePaisa / 100)
  const fmt = (v: number | null) => (v === null ? "Unlimited" : v.toString())

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
      <h2 style="margin-bottom:4px">Your ShopNest plan has been updated</h2>
      <p style="color:#555">Your subscription has been changed to the <strong>${params.newPlanName}</strong> plan.</p>
      <table style="border-collapse:collapse;width:100%;margin:24px 0">
        <tr><th style="text-align:left;padding:8px 12px;background:#f5f5f5">Feature</th><th style="text-align:left;padding:8px 12px;background:#f5f5f5">Your Limit</th></tr>
        <tr><td style="padding:8px 12px;border-top:1px solid #eee">Monthly price</td><td style="padding:8px 12px;border-top:1px solid #eee">৳${priceTaka}/month</td></tr>
        <tr><td style="padding:8px 12px;border-top:1px solid #eee">Products</td><td style="padding:8px 12px;border-top:1px solid #eee">${fmt(params.features.max_products)}</td></tr>
        <tr><td style="padding:8px 12px;border-top:1px solid #eee">Categories</td><td style="padding:8px 12px;border-top:1px solid #eee">${fmt(params.features.max_categories)}</td></tr>
        <tr><td style="padding:8px 12px;border-top:1px solid #eee">Orders/month</td><td style="padding:8px 12px;border-top:1px solid #eee">${fmt(params.features.max_orders_per_month)}</td></tr>
        <tr><td style="padding:8px 12px;border-top:1px solid #eee">Images per product</td><td style="padding:8px 12px;border-top:1px solid #eee">${params.features.max_images_per_product}</td></tr>
        <tr><td style="padding:8px 12px;border-top:1px solid #eee">Discount codes</td><td style="padding:8px 12px;border-top:1px solid #eee">${params.features.discount_codes ? "✓ Included" : "✗ Not included"}</td></tr>
      </table>
      <p style="color:#555;font-size:13px">Changes are effective immediately. If you have any questions, please contact ShopNest support.</p>
    </div>
  `

  const resend = getResend()
  const fromAddress = getEnv("EMAIL_FROM") || "ShopNest <onboarding@resend.dev>"

  try {
    await resend.emails.send({
      from: fromAddress,
      to: [merchant.owner.email],
      subject: `Your ShopNest plan has been updated to ${params.newPlanName}`,
      html,
    })
    console.log(`[sendPlanChangedEmail] Sent plan_changed email to ${merchant.owner.email}`)
  } catch (err) {
    // Fire-and-forget — never throw (Invariant 6)
    console.error("[sendPlanChangedEmail] Resend error:", err)
  }
}
```

> **Note:** `email_logs` uses `order_id` as a required FK. `sendPlanChangedEmail` does **not** log to `email_logs` (no order context). It logs to the console only. A separate `system_email_logs` table can be added in a later unit if needed.

---

## Merchants Relations: Add `owner`

`sendPlanChangedEmail` uses `with: { owner: true }`. Add the relation to `db/schema.ts`:

```typescript
// In merchantsRelations — add:
owner: one(user, {
  fields: [merchants.ownerId],
  references: [user.id],
}),
```

---

## Super Admin UI: Plan Change in Subscription Manager Drawer

The subscription manager drawer (built in Unit 11, enhanced in Unit 18) already allows the admin to record payments and change a merchant's plan as a side effect. This unit adds an **explicit "Change Plan" section** separate from the payment recording flow.

### Where it lives

`app/(admin)/admin/subscriptions/` — in the existing `SubscriptionsClient` component's merchant drawer.

### New section: "Change Plan"

Below the existing subscription status and payment history sections, add:

```
─────────────────────────────
Change Plan
─────────────────────────────
Current plan:  [Growth]  (badge)
New plan:      [Select plan dropdown]   ← lists all non-archived plans from DB
               [Change Plan button]
```

- The **Select plan dropdown** lists all non-archived `subscription_plans` rows, excluding the current plan.
- Clicking **Change Plan** calls `changeMerchantPlanAction`.
- On success: drawer shows a success toast, current plan badge updates.
- On downgrade block: the error UI renders **each violation message** individually as a separate alert line (not a single blob of text). Example:

  ```
  ⚠ You have 80 active products, but the Starter plan allows a maximum of 50.
    Please delete or deactivate products before downgrading.

  ⚠ You have 3 active discount codes, but the Starter plan does not include
    discount codes. Please delete all discount codes before downgrading.
  ```

- On other error (network, DB): single error toast.
- The admin **cannot** dismiss violations and force the change through — there is no "force downgrade" override in V1.

### Zod validation for action params

```typescript
// In app/actions/admin.ts or lib/validations/admin.ts
export const changePlanSchema = z.object({
  merchantId:   z.string().min(1),
  targetPlanId: z.string().min(1),
})
```

---

## Snapshot Write on Payment Verification

`verifySubscriptionPaymentAction` (already in `app/actions/admin.ts`) must also call `writeSubscriptionSnapshot` on success using the submission-time snapshotted features (with fallback to live plan features if missing), so renewals refresh the snapshot:

```typescript
// Resolve which features to use for limit validation and snapshot writing.
// Priority: features locked at payment submission > live plan definition.
const featuresForVerification =
  (payment.featuresAtPaymentTime as PlanFeatures | null) ??
  targetPlan?.features ??
  null

if (targetPlan && featuresForVerification) {
  const { writeSubscriptionSnapshot } = await import("@/db/queries/subscriptions")
  await writeSubscriptionSnapshot(payment.merchantId, featuresForVerification)

  // Also sync merchants.plan and subscriptions.plan_id
  await db.update(subscriptions).set({ planId: targetPlan.id, plan: targetPlan.slug }).where(eq(subscriptions.merchantId, payment.merchantId))
  await db.update(merchants).set({ plan: targetPlan.slug }).where(eq(merchants.id, payment.merchantId))
} else if (targetPlan) {
  // Fallback: no featuresAtPaymentTime (legacy row) — use live plan features
  const { writeSubscriptionSnapshot } = await import("@/db/queries/subscriptions")
  await writeSubscriptionSnapshot(payment.merchantId, targetPlan.features)

  await db.update(subscriptions).set({ planId: targetPlan.id, plan: targetPlan.slug }).where(eq(subscriptions.merchantId, payment.merchantId))
  await db.update(merchants).set({ plan: targetPlan.slug }).where(eq(merchants.id, payment.merchantId))
}
```

---

## Design: Downgrade Error UI in Admin Drawer

- Each violation renders as a `<Alert variant="warning">` from `components/ui/feedback/Alert`.
- Violations are listed **before** the "Change Plan" button so the admin reads them before acting.
- The "Change Plan" button is **not disabled** before validation — validation runs server-side on submit, then the violations are displayed.
- No inline form disable logic based on current vs. target plan price comparison — keep the UI simple.

---

## Dependencies

No new packages. All capabilities exist in the current stack:
- Drizzle ORM — new snapshot columns migration
- `lib/plans/` — new `validateDowngrade.ts` file, updated `getPlan.ts`
- `lib/email.ts` — new `sendPlanChangedEmail` function
- Resend — existing integration, no new config
- TanStack Form / React — existing dashboard form patterns
- `components/ui` — existing `Alert`, `Select`, `Button` components

---

## Verification Checklist

### Database
- [x] Migration adds all 6 `snapshot_*` columns to `subscriptions` with correct types
- [x] Backfill SQL correctly populates snapshot columns for all existing subscription rows
- [x] `snapshot_discount_limit = 0` correctly maps to `discount_codes: false` in enforcement
- [x] `null` snapshot columns correctly map to "unlimited" in enforcement
- [x] `email_logs.order_id` is now nullable (schema migration applied)
- [x] `features_at_payment_time` JSONB column exists on `subscription_payments` (migration `0021_lively_arclight.sql` applied)

### Snapshot Write / Refresh & Payment Submission Snapshots
- [x] `writeSubscriptionSnapshot()` updates all 6 columns atomically in a single UPDATE
- [x] `submitPaymentAction` snapshots plan features (`featuresAtPaymentTime`) at submission
- [x] `recordSubscriptionPaymentAction` (admin direct record) snapshots plan features
- [x] Calling `verifySubscriptionPaymentAction` on a payment writes the snapshot from `featuresAtPaymentTime` (falling back to live plan features if missing)
- [x] Verification limit checks use `featuresAtPaymentTime` and do not hard-block/throw errors
- [x] Calling `changeMerchantPlanAction` on success writes the new plan's snapshot
- [x] Editing a plan's features via `updatePlanAction` (Unit 18) does NOT update any merchant snapshots
- [x] A merchant subscribed to Growth before a Growth limit change retains their old limits

### Limit Enforcement (Regression + New)
- [x] `getMerchantPlan()` reads limits from snapshot columns when they are populated
- [x] `getMerchantPlan()` falls back to live plan features when snapshot columns are all null
- [x] `assertPlanLimit("max_products", ...)` enforces the snapshotted product limit, not the live plan's
- [x] `assertPlanLimit("max_categories", ...)` enforces the snapshotted category limit
- [x] `assertPlanFeature("discount_codes", ...)` correctly reads snapshot (`snapshotDiscountLimit === 0` → blocked)

### Downgrade Validation
- [x] `validateDowngrade()` returns a violation when products exceed target limit
- [x] `validateDowngrade()` returns a violation when categories exceed target limit
- [x] `validateDowngrade()` returns a violation when merchant has discount codes and target plan disables them
- [x] `validateDowngrade()` returns a violation when a product has more images than the target allows
- [x] `validateDowngrade()` returns an empty array (safe) when all counts are within target limits
- [x] Monthly order count does NOT trigger a downgrade violation (orders cannot be deleted)
- [x] Upgrade (target plan price > current plan price) skips validation entirely and always succeeds

### `changeMerchantPlanAction`
- [x] Returns `{ success: false, errors: [...] }` with per-field violation messages when blocked
- [x] Returns `{ success: false, error: "..." }` for unexpected errors (plan not found, DB error)
- [x] Returns `{ success: true }` and updates `subscriptions.plan_id`, `subscriptions.plan`, `merchants.plan`, and all snapshot columns on success
- [x] Assigning an archived plan returns an error
- [x] Non-admin call returns Unauthorized error

### Admin UI — Plan Change Drawer & Plan Drift Warnings
- [x] "Change Plan" section renders with current plan badge and plan selector
- [x] Plan selector lists only non-archived plans, excluding the current plan
- [x] On success: success toast shown, current plan badge updates to new plan name
- [x] On downgrade violation: each violation renders as a separate warning alert
- [x] Admin cannot force a blocked downgrade — there is no override button
- [x] Subscriptions page lists pending payments with an amber warning badge if the plan changed after submission
- [x] Verify Dialog Modal renders an amber warning banner if plan drift is detected

### Email Notification
- [x] Merchant receives a `plan_changed` email when admin changes their plan (upgrade or downgrade)
- [x] Email contains: new plan name, price, product limit, category limit, order limit, discount code feature status
- [x] Email is sent to the merchant's registered user email address
- [x] Email failure does NOT cause the plan change action to fail (fire-and-forget)
- [x] No email is sent when the plan change action itself fails (email is only sent on success)

