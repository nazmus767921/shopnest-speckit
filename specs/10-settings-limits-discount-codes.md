# Spec 10: Settings, Limits & Discount Codes

## Goal
Implement the `(dashboard)/settings` and `(dashboard)/billing` pages, allowing merchants to configure their store details and view subscription status. Build the Discount Codes CRUD interface exclusive to the Growth plan, and strictly enforce the Starter plan constraints (max 50 products, 200 orders) at the server level.

## Design
- **Settings Page (`/dashboard/settings`)**: A unified settings page with sections for Store Profile (Store Name, Phone Number, etc.) and Inventory Preferences (e.g., global low stock threshold defaults).
- **Billing Page (`/dashboard/billing`)**: A clean dashboard view displaying the active plan (Starter vs Growth), subscription status (Trial, Active, Suspended, Cancelled), trial expiry date or next billing date, and a table showing the `subscription_payments` history.
- **Discount Codes (`/dashboard/discounts` or integrated into `settings`)**: A data table showing active and expired discount codes (code string, discount type, value, usage count, expiry). Includes a "Create Discount Code" form. For Starter plan users, this section will display an upsell message locking the feature.
- **Plan Limits**: Visually represented when limits are approached (e.g., disabling the "Add Product" button if at 50/50 products), with absolute enforcement via server actions.

## Implementation

### 1. Database Queries & Schemas
- **Merchants & Billing**: Create queries in `db/queries/merchants.ts` and `db/queries/subscriptions.ts` to fetch store settings, subscription details, and payment histories.
- **Discount Codes**: Add schema definitions (if not fully implemented) and queries in `db/queries/discounts.ts` to perform CRUD operations on the `discount_codes` table.

### 2. Server Actions & Constraints
- **Settings**: Add `updateStoreSettings` action to update the `merchants` table (excluding immutable fields like `subdomain`).
- **Discounts**: Add `createDiscountCode`, `updateDiscountCode`, and `deleteDiscountCode` server actions.
  - *Invariant Guard*: Verify via `auth.api.getSession()` to ensure the merchant's plan is `growth` before allowing creation or modification of discount codes.
- **Server Limit Enforcement**:
  - Update the `createProduct` server action to count current products and throw an error if a Starter plan merchant attempts to exceed 50 products.
  - Update the checkout/order creation logic to count the merchant's current monthly orders and gracefully reject checkout if a Starter plan merchant exceeds 200 orders in the current billing cycle.

### 3. Dashboard UI Components
- **Settings View**: Implement a TanStack Form for store details utilizing `components/ui/` primitives.
- **Billing View**: Build `SubscriptionOverview` and `PaymentHistoryTable` components.
- **Discounts View**: Create the table UI to list discount codes and a modal/drawer to add/edit codes. Incorporate a `PlanUpsellBanner` component shown to Starter plan users in place of the creation UI.

## Dependencies
- No new packages needed. Will reuse existing `TanStack Form`, `Zod`, `Lucide React`, and `components/ui` primitives.

## Verification Checklist
- [x] Can a merchant successfully update their store name and settings on the settings page?
- [x] Does the settings action strictly reject updates to the `subdomain` field?
- [x] Does the billing page accurately reflect the merchant's current plan, subscription status, and payment history?
- [x] Can a Growth plan merchant seamlessly create, view, edit, and delete discount codes?
- [x] Are Starter plan merchants prevented from interacting with discount code creation in the UI?
- [x] Are the discount code server actions actively blocking creation attempts from non-Growth plan merchants?
- [x] Is a Starter plan merchant blocked (via server action) from adding a 51st product?
- [x] Is the storefront checkout actively preventing order creation if a Starter plan merchant exceeds 200 orders for the current cycle?
