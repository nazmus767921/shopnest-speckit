# Research Notes: Cash on Delivery (COD) Checkout Integration

This document outlines the technical decisions, research findings, and alternatives considered for implementing the Cash on Delivery (COD) feature.

## 1. Database Schema Extensions

### Decision
- Add `codEnabled: boolean("cod_enabled").notNull().default(false)` and `payDeliveryChargeFirst: boolean("pay_delivery_charge_first").notNull().default(false)` to the `merchants` table in [db/schema.ts](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/db/schema.ts).
- Add `returned` to the allowed statuses in order-related queries and validation functions.
- Extend `paymentConfirmations` to allow `cod` as a `paymentMethod` when no upfront delivery charge is paid.

### Rationale
- Storing settings as boolean columns ensures maximum type safety, standard Drizzle migrations, and easy form binding.
- Keeping `paymentConfirmations` as the single source of truth for payment metadata (payment method, transaction ID) allows the existing dashboard components to render payment details without adding columns to `orders`.

### Alternatives Considered
- **JSONB Configuration Column**: Putting payment configurations in a `payment_settings` JSONB column. Rejected because explicit database columns are cleaner, self-documenting, and work better with Drizzle's auto-generated types.

---

## 2. Order Status Lifecycle and Stock Restoration

### Decision
- When an order transitions to `returned` status, the system must trigger a stock restoration query.
- This logic will be integrated into the `updateOrderStatus` query function inside [db/queries/orders.ts](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/db/queries/orders.ts) inside a Postgres transaction, matching the current `cancelled` behavior.

### Rationale
- Placing stock restoration in the query transaction guarantees data integrity and satisfies Invariant 2 (Stock non-negative / inventory consistency).
- Reusing the database transaction prevents concurrency issues if multiple status updates occur simultaneously.

### Alternatives Considered
- **Restoring stock in Server Actions**: Updating stock in the next.js action layer. Rejected because a network failure or error after database update would leave the database in an inconsistent state, violating Principle II (functional boundaries) and Invariant 2.

---

## 3. Plan Feature Enforcement

### Decision
- Retrieve the merchant's active plan using `getMerchantPlan(merchantId)` before saving settings.
- Enforce that `plan.features.cod` must be `true` to allow enabling `codEnabled` or `payDeliveryChargeFirst` in `updateStoreSettingsAction`.

### Rationale
- Enforces Invariant 7 (Limits enforced server-side). Toggles are validated on the server, not just hidden on the client.

---

## 4. UI Settings Layout & DESIGN.md Compliance

### Decision
- Add the `codEnabled` and `payDeliveryChargeFirst` toggles in the Payments tab of `StoreSettingsForm.tsx` using the `Switch` component.
- Ensure the colors match DESIGN.md tokens:
  - Active switches use `bg-primary`.
  - Content containers use `bg-canvas-light` and `border-hairline-light` with `rounded-full` pill buttons.
  - No custom text colors (use `text-ink` and `text-shade-50`).

### Rationale
- Adheres to Invariants 8 & 9 (UI primitives and DESIGN.md styling compliance).
