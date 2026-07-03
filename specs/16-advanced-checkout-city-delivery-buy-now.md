# Spec 16 — Advanced Checkout: Shipping Zones & "Buy Now"

## Goal

Redesign the shipping configuration system from a flat per-city list into an industry-standard **Zone → District** hierarchy (matching Shopify/WooCommerce's model). Give merchants full manual control to define named shipping zones, bulk-assign Bangladesh districts to each zone, set per-zone delivery fees, and configure optional free-shipping thresholds per zone. Add a merchant-level fallback fee for unassigned districts. Implement the "Buy Now" Zustand store for single-item checkout bypass. All of this builds on our static `BANGLADESH_GEOGRAPHY` (8 divisions, 64 districts).

---

## Design Decisions (from grilling session)

| Decision | Choice |
|---|---|
| Home city auto-detection | ❌ None — full manual control |
| Zone model | Named zones, merchant creates and names them |
| District assignment | Multi-select checklist per zone (bulk assign) |
| Merchant customises scope | Can assign main city only or whole division |
| Unassigned districts at checkout | Fallback default fee (merchant-configured) |
| Free shipping threshold | ✅ Per-zone minimum order value |
| Tier naming | Free-form — merchant names zones (e.g., "Inside Dhaka", "Nationwide") |

---

## Design

### Merchant Dashboard — Shipping & Delivery Settings Tab

The tab replaces the current flat per-district list with a **Zone-first UI**:

1. **Fallback Fee Card** — Always visible at the top. A single number input: "Default delivery fee for areas not in any zone." Can be ৳0 (free) or any positive paisa value. Stored on `merchants.fallback_delivery_charge_paisa`.

2. **Zones List** — Below the fallback card. Each Zone card shows:
   - Zone name (editable inline or on re-create)
   - Delivery fee (৳)
   - Free shipping threshold (optional, e.g., "Free above ৳500" — empty = always charge)
   - The assigned districts as compact pills grouped by division
   - A **Delete Zone** button

3. **Add Zone Flow** (inline panel, not a modal):
   - **Step 1 — Zone details**: Name + Delivery fee (Taka) + optional "Free above ৳X" threshold
   - **Step 2 — Assign Districts**: Expandable accordion per Division (8 divisions). Clicking a division expands all its districts as checkboxes. "Select All" button per division. Previously-assigned districts in other zones are shown greyed-out to prevent conflicts.
   - **Save Zone** button

4. Empty state: "No shipping zones configured. Add a zone to enable location-based delivery pricing at checkout."

### Checkout Flow (Storefront)

- Division and District selects remain as **two dependent dropdowns** (Division → District) — but now only **configured divisions/districts** appear as options.
- On district selection, the system looks up which zone the district belongs to, applies its delivery fee, and checks the free-shipping threshold against the cart subtotal.
- If the customer selects a district **not in any zone**, the merchant's `fallback_delivery_charge_paisa` is applied silently.
- If the merchant has **zero zones configured**, both dropdowns fall back to plain text inputs with no fee calculation.

### "Buy Now" Flow

Unchanged in concept: a persisted Zustand store (`useCheckoutStore`) that holds at most one product. The `CheckoutClientPage` checks this store first; if it has items, those are used for checkout instead of the cart.

> **Note:** The current implementation uses `persist` middleware (fixed during development). The spec originally stated in-memory only. Keep persist middleware for reliability.

---

## Database Schema Changes

### New Table: `shipping_zones`

Replaces the current `delivery_zones` table.

```ts
export const shippingZones = pgTable("shipping_zones", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),                                      // e.g. "Inside Dhaka"
  deliveryChargePaisa: integer("delivery_charge_paisa").notNull().default(0),
  freeShippingThresholdPaisa: integer("free_shipping_threshold_paisa"), // NULL = never free
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("shipping_zones_merchant_id_idx").on(table.merchantId),
]).enableRLS()
```

### New Table: `shipping_zone_districts`

A mapping table linking zones to their assigned districts.

```ts
export const shippingZoneDistricts = pgTable("shipping_zone_districts", {
  id: text("id").primaryKey(),
  zoneId: text("zone_id")
    .notNull()
    .references(() => shippingZones.id, { onDelete: "cascade" }),
  merchantId: text("merchant_id")  // Denormalised for Invariant 1 query safety
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  division: text("division").notNull(),
  district: text("district").notNull(),
}, (table) => [
  uniqueIndex("shipping_zone_districts_zone_district_unique_idx").on(table.zoneId, table.district),
  index("shipping_zone_districts_merchant_id_idx").on(table.merchantId),
]).enableRLS()
```

### Modify: `merchants` table

Add fallback delivery fee:
```ts
fallbackDeliveryChargePaisa: integer("fallback_delivery_charge_paisa").notNull().default(0),
```

### Existing: `orders.delivery_charge_paisa`

Already added in the v1 implementation. No changes needed.

### Relations

```ts
// Add to merchantsRelations:
shippingZones: many(shippingZones),
shippingZoneDistricts: many(shippingZoneDistricts),

export const shippingZonesRelations = relations(shippingZones, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [shippingZones.merchantId],
    references: [merchants.id],
  }),
  districts: many(shippingZoneDistricts),
}))

export const shippingZoneDistrictsRelations = relations(shippingZoneDistricts, ({ one }) => ({
  zone: one(shippingZones, {
    fields: [shippingZoneDistricts.zoneId],
    references: [shippingZones.id],
  }),
  merchant: one(merchants, {
    fields: [shippingZoneDistricts.merchantId],
    references: [merchants.id],
  }),
}))
```

> **Migration:** After schema changes, run:
> ```
> pnpm drizzle-kit generate
> pnpm drizzle-kit migrate
> ```

---

## Implementation

### 1. DB Queries — `db/queries/shippingZones.ts` [NEW]

```ts
// Returns all zones with their assigned districts (joined)
getShippingZonesWithDistricts(merchantId: string)

// Creates zone + district assignments in a single transaction
createShippingZone({
  merchantId,
  name,
  deliveryChargePaisa,
  freeShippingThresholdPaisa,  // nullable
  districts: Array<{ division: string; district: string }>
})

// Deletes zone — cascades to shipping_zone_districts automatically
deleteShippingZone({ id, merchantId })

// Returns all districts assigned to any zone for this merchant
// Used at checkout to resolve which zone a district belongs to
resolveDistrictZone(merchantId: string, district: string):
  Promise<{ deliveryChargePaisa: number; freeShippingThresholdPaisa: number | null } | null>
```

### 2. Server Actions — `app/actions/shippingZones.ts` [NEW]

```ts
"use server"

// Creates a named zone with districts and optional threshold
createShippingZoneAction(input: {
  name: string
  deliveryChargePaisa: number
  freeShippingThresholdPaisa: number | null
  districts: Array<{ division: string; district: string }>
}) -> { success: true; zone: ShippingZone } | { error: string }

// Deletes a zone (and cascades its district assignments)
deleteShippingZoneAction(input: { id: string })
  -> { success: true } | { error: string }

// Updates the merchant's fallback delivery charge
updateFallbackDeliveryChargeAction(input: { fallbackChargePaisa: number })
  -> { success: true } | { error: string }
```

All actions resolve `merchantId` from `auth.api.getSession()` — never trust client-supplied IDs.

### 3. Zod Validation — `lib/validations/shippingZones.ts` [NEW]

```ts
import { z } from "zod"

export const shippingZoneSchema = z.object({
  name: z.string().min(2, "Zone name must be at least 2 characters"),
  deliveryChargePaisa: z.number().int().min(0, "Delivery charge cannot be negative"),
  freeShippingThresholdPaisa: z.number().int().min(0).nullable(),
  districts: z.array(z.object({
    division: z.string().min(2),
    district: z.string().min(2),
  })).min(1, "Assign at least one district to this zone"),
})

export const fallbackChargeSchema = z.object({
  fallbackChargePaisa: z.number().int().min(0, "Fallback charge cannot be negative"),
})
```

### 4. Settings — Shipping & Delivery Tab [MODIFY/NEW]

**File:** `app/(dashboard)/dashboard/settings/components/ShippingDeliveryTab.tsx` [REWRITE]

Significant UI rework from the v1 implementation. This component:

1. Shows the **Fallback Fee card** — inline editable, saves via `updateFallbackDeliveryChargeAction`.
2. Shows **Zone cards** with district pills grouped by division.
3. **Add Zone panel** (toggled inline):
   - Name field + Delivery fee field + Optional threshold field
   - Division accordion (`BANGLADESH_GEOGRAPHY` data) with checkboxes per district
   - "Select All" per division, districts already taken by other zones are disabled
   - Save + Cancel
4. Zone delete with optimistic UI update.

**File:** `app/(dashboard)/dashboard/settings/page.tsx` [MODIFY]

- Import `getShippingZonesWithDistricts` from `db/queries/shippingZones`.
- Fetch zones: `const shippingZones = await getShippingZonesWithDistricts(merchant.id)`.
- Pass `shippingZones` and `merchant.fallbackDeliveryChargePaisa` to `<StoreSettingsForm>`.

**File:** `app/(dashboard)/dashboard/settings/components/StoreSettingsForm.tsx` [MODIFY]

- Update `StoreSettingsFormProps` interface to accept the new zone shape.
- Update `<ShippingDeliveryTab>` prop types.

### 5. Checkout Page — Division/District Dropdowns [MODIFY]

**File:** `app/(storefront)/[subdomain]/checkout/page.tsx`

Replace `getDeliveryZonesByMerchantId` import with `getShippingZonesWithDistricts`. Pass zones and `fallbackDeliveryChargePaisa` from merchant as props.

**File:** `components/storefront/CheckoutClientPage.tsx`

Fee resolution logic:
```ts
// On district selection:
const zone = shippingZones
  .flatMap(z => z.districts.map(d => ({ ...d, zone: z })))
  .find(d => d.district === selectedDistrict)

if (zone) {
  const subtotal = activeSubtotalPaisa
  const isFree = zone.zone.freeShippingThresholdPaisa !== null
    && subtotal >= zone.zone.freeShippingThresholdPaisa
  setDeliveryChargePaisa(isFree ? 0 : zone.zone.deliveryChargePaisa)
  setIsFreeShipping(isFree)
} else {
  // District not in any zone — apply merchant fallback
  setDeliveryChargePaisa(fallbackDeliveryChargePaisa)
}
```

Order summary should also display a contextual message: "Free shipping on your order!" when threshold is met.

### 6. "Buy Now" Flow

No changes from v1 implementation. `useCheckoutStore` with `persist` middleware is already correct and working.

---

## File Summary

| Status | File |
|--------|------|
| [NEW] | `db/queries/shippingZones.ts` |
| [NEW] | `app/actions/shippingZones.ts` |
| [NEW] | `lib/validations/shippingZones.ts` |
| [DELETE] | `db/queries/deliveryZones.ts` — replaced by shippingZones |
| [DELETE] | `app/actions/deliveryZones.ts` — replaced by shippingZones |
| [DELETE] | `lib/validations/deliveryZones.ts` — replaced by shippingZones |
| [MODIFY] | `db/schema.ts` — add `shippingZones`, `shippingZoneDistricts` tables + `fallbackDeliveryChargePaisa` on `merchants` |
| [MODIFY] | `db/queries/orders.ts` — no changes needed (delivery_charge_paisa already exists) |
| [MODIFY] | `lib/validations/checkout.ts` — no changes needed |
| [MODIFY] | `app/(storefront)/[subdomain]/checkout/page.tsx` — use new zones query |
| [MODIFY] | `components/storefront/CheckoutClientPage.tsx` — zone-aware fee resolution + threshold |
| [MODIFY] | `app/(dashboard)/dashboard/settings/components/StoreSettingsForm.tsx` — update prop types |
| [MODIFY] | `app/(dashboard)/dashboard/settings/components/ShippingDeliveryTab.tsx` — full rewrite |
| [MODIFY] | `app/(dashboard)/dashboard/settings/page.tsx` — use new zones query |
| [KEEP]   | `lib/checkout/checkout-store.ts` — unchanged, persist middleware correct |
| [KEEP]   | `hooks/use-buy-now.ts` — unchanged |
| [KEEP]   | `components/storefront/BuyNowButton.tsx` — unchanged |
| [KEEP]   | `components/storefront/ProductCard.tsx` (Buy Now button) — unchanged |
| [KEEP]   | Product detail page (Buy Now button) — unchanged |

---

## Verification Checklist

### Schema & Database
- [ ] `shipping_zones` table exists after migration.
- [ ] `shipping_zone_districts` table exists after migration with unique constraint on `(zone_id, district)`.
- [ ] `merchants.fallback_delivery_charge_paisa` column exists.
- [ ] Both tables have RLS enabled.
- [ ] `createShippingZone` never inserts without `merchantId` (Invariant 1).
- [ ] `deleteShippingZone` filters by both `id` AND `merchantId`.
- [ ] Deleting a zone cascades and removes all its district rows.

### Shipping & Delivery Settings Tab
- [ ] Fallback fee card visible and editable; saving persists to DB.
- [ ] "Add Zone" panel opens inline; closes on Cancel without saving.
- [ ] Merchant can name a zone, set a fee, and optionally set a free-shipping threshold.
- [ ] Division accordion expands/collapses correctly.
- [ ] Districts already assigned to another zone are greyed-out / disabled in the checklist.
- [ ] "Select All" checkbox selects all available (non-taken) districts in a division.
- [ ] Saving zone creates zone + district mapping rows in DB.
- [ ] Saved zone appears in the zone list with district pills.
- [ ] Deleting a zone removes it and its district assignments.

### Checkout — Fee Resolution
- [ ] Division dropdown shows only configured divisions.
- [ ] District dropdown shows only configured districts for the selected division.
- [ ] Selecting a district in a zone applies that zone's delivery fee.
- [ ] Free shipping threshold met: fee shows as ৳0 / "Free" + contextual message.
- [ ] Selecting an unassigned district applies the fallback fee.
- [ ] Fee updates reactively on district change without page reload.
- [ ] `deliveryChargePaisa` stored in DB order record matches what was displayed at checkout.

### Buy Now Flow
- [ ] "Buy Now" button present on ProductCard and product detail page.
- [ ] Clicking "Buy Now" navigates to checkout with only that product.
- [ ] Completing a Buy Now order creates correct DB record.
- [ ] Cart items preserved throughout Buy Now flow.
- [ ] `useCheckoutStore` cleared after order confirmation.
