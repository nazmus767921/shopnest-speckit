# Spec Unit 13: Dashboard Key Metrics

## Goal
Make the merchant dashboard metrics cards (Total Sales, Active Products, and Active Orders) and setup checklist dynamic and functional by fetching real-time data from the database scoped to the logged-in merchant.

## Design
- Maintain the current aesthetic of the cards matching `DESIGN.md`.
- **Total Sales Card**: Render the sum of confirmed order totals in Taka format (`৳ X.XX`). Display helper text indicating that only confirmed payment orders are counted.
- **Active Products Card**:
  - For Starter plan: Display progress bar showing progress toward the 50 product limit.
  - For Growth plan: Hide the progress bar entirely and only show the 'Growth Plan: Unlimited products' description.
- **Active Orders Card**: Display the count of orders in progress (`pending_payment` with confirmation, `processing`, and `shipped`). Below, display `Pending` (representing `pending_payment` orders) and `Completed` (representing `delivered` orders).
- **Setup Checklist**:
  - `Register merchant account`: permanently checked (`done: true`).
  - `Select boutique subdomain`: permanently checked (`done: true`).
  - `Add your first product catalog listing`: checked if active products count > 0.
  - `Configure bKash / Nagad merchant details`: checked if merchant has configured `bkashNumber` or `nagadNumber`.
  - `Share storefront URL on social networks`: permanently unchecked (`done: false`) as a static tip/reminder.
- **Subscription Plan Section**: Dynamically display the plan (e.g. `Starter (Free Trial)` or `Growth`) and the status badge.

## Implementation

### 1. Database Queries
We will execute Drizzle query operations directly inside the async React Server Component `app/(dashboard)/dashboard/page.tsx`.
- **Total Sales**:
  ```typescript
  import { orders, products, paymentConfirmations } from "@/db/schema"
  import { eq, and, isNull, sum, count, ne, exists, inArray } from "drizzle-orm"

  const [totalSalesResult] = await db
    .select({ value: sum(orders.totalPaisa) })
    .from(orders)
    .where(
      and(
        eq(orders.merchantId, merchant.id),
        inArray(orders.status, ["processing", "shipped", "delivered"])
      )
    )
  const totalSalesTaka = Number(totalSalesResult?.value || 0) / 100
  ```
- **Active Products Count**:
  ```typescript
  const [activeProductsResult] = await db
    .select({ value: count() })
    .from(products)
    .where(
      and(
        eq(products.merchantId, merchant.id),
        isNull(products.deletedAt)
      )
    )
  const activeProductsCount = activeProductsResult?.value || 0
  ```
- **Orders Counts grouped by status**:
  ```typescript
  const existsConfirmation = exists(
    db
      .select()
      .from(paymentConfirmations)
      .where(eq(paymentConfirmations.orderId, orders.id))
  )

  const statusCounts = await db
    .select({
      status: orders.status,
      count: count(),
    })
    .from(orders)
    .where(
      and(
        eq(orders.merchantId, merchant.id),
        or(
          ne(orders.status, "pending_payment"),
          existsConfirmation
        )
      )
    )
    .groupBy(orders.status)
  ```

### 2. UI Updates in `app/(dashboard)/dashboard/page.tsx`
- Replace hardcoded statistics values with the fetched database statistics.
- Dynamically render the progress bar under "Active Products" only if the merchant is on the Starter plan. Calculate progress percentage `(activeProductsCount / 50) * 100` and cap at 100.
- Update the checklist array `done` states based on the queries.
- Update the subscription plan name and status badge based on `merchant.plan` and `merchant.subscriptionStatus`.

## Dependencies
None. Uses existing database libraries and Lucide icons.

## Verification Checklist
- [x] Confirm Total Sales only calculates orders with confirmed payment (`processing`, `shipped`, `delivered`).
- [x] Confirm Active Products count does not include deleted products.
- [x] Confirm product progress bar is displayed and calculated properly for Starter plan, and hidden for Growth plan.
- [x] Confirm Active Orders card counts are calculated correctly:
  - Big number = `pending_payment` (with confirmation) + `processing` + `shipped`.
  - Pending label = `pending_payment` (with confirmation).
  - Completed label = `delivered`.
- [x] Confirm checklist items (products, payment configuration) update dynamically on the dashboard.
- [x] Confirm `pnpm build` succeeds.
