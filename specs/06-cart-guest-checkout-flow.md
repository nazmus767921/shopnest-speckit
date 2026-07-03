# Spec Unit 6: Cart & Guest Checkout Flow

## Goal

Integrate Better Auth `anonymous` and `emailOTP` plugins to support guest checkout via phone OTP. Build client-side cart state with Zustand, the `(storefront)/cart` review page, and the `(storefront)/checkout` multi-step page. Implement atomic order creation in `db/queries/orders.ts` using a Drizzle transaction with a `WHERE stock_count >= quantity` guard to prevent overselling.

---

## Design

### Visual Direction

Checkout pages stay on the **light transactional canvas track** — consistent with the storefront (`bg-canvas-cream`, `bg-canvas-light` cards, `border border-hairline-light` depth).

- **Cart page:** Two-column layout on `md+` (item list left, order summary right). Single column stacked on mobile. Cart items rendered in `Card` components with product image thumbnail, name, price, quantity stepper, and a remove button.
- **Checkout page:** Stepper progress indicator at the top (3 steps: `Address ? Payment ? Confirm`). One step visible at a time. Each step content in a `Card`. CTA buttons always `button-primary-pill` (full-width on mobile, auto on desktop). Back links are plain text with a `ChevronLeft` icon.
- **OTP modal:** `Modal` from `components/ui/feedback`. Centered, with a 6-digit OTP input built from 6 individual `Input` fields with auto-focus-advance behavior. Timer countdown for resend.
- **Payment instructions card:** Distinct `bg-canvas-light border border-hairline-light rounded-xl p-6`. Shows merchant's bKash/Nagad number prominently in `font-mono text-display-sm`. QR code image if provided. Order number displayed in `font-mono text-body-strong` with instruction to insert it in the payment reference/note field.
- **Empty cart state:** `EmptyState` component from `components/ui/data-display` with a `ShoppingCart` icon, "Your cart is empty", and a "Continue Shopping" pill CTA linking back to the storefront catalog.

### Typography

- Step labels in stepper: `text-eyebrow-cap tracking-widest font-semibold text-shade-40` (inactive), `text-ink` (active).
- Section headings within a step: `text-heading-lg font-semibold`.
- Cart item name: `text-body-strong font-semibold`.
- Price figures: `font-bold` with `?` prefix from `formatTaka()`.
- Order number in payment step: `font-mono text-display-sm text-ink`.
- Merchant bKash/Nagad number: `font-mono text-display-md font-bold`.

### Structural Layout

```
(storefront)/
+-- [subdomain]/
    +-- cart/
    ¦   +-- page.tsx           ? Cart review [NEW]
    +-- checkout/
        +-- page.tsx           ? Multi-step checkout [NEW]
```

---

## Implementation

### 1. Database Schema Additions

Add the following tables to `db/schema.ts`. Run `pnpm drizzle-kit generate` and `pnpm drizzle-kit migrate` after.

#### `orders` table

```ts
export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  // null for guest orders; populated if the customer has a Better Auth user account
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  // phone number for guest orders (used as the stable customer identifier)
  guestPhone: text("guest_phone"),
  status: text("status").notNull().default("pending_payment"),
  // status enum: pending_payment | processing | shipped | delivered | cancelled
  deliveryName: text("delivery_name").notNull(),
  deliveryPhone: text("delivery_phone").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryCity: text("delivery_city").notNull(),
  totalPaisa: integer("total_paisa").notNull(),
  discountPaisa: integer("discount_paisa").notNull().default(0),
  discountCodeId: text("discount_code_id"), // FK to discount_codes (nullable, Unit 10)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}).enableRLS()
```

#### `order_items` table

```ts
export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  merchantId: text("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  // Snapshot the product name at time of order
  productName: text("product_name").notNull(),
  // unit_price at time of order — NEVER recalculated from products table (Invariant 3)
  unitPricePaisa: integer("unit_price_paisa").notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}).enableRLS()
```

#### `payment_confirmations` table

```ts
export const paymentConfirmations = pgTable("payment_confirmations", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }).unique(),
  merchantId: text("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  paymentMethod: text("payment_method").notNull(), // bkash | nagad
  transactionId: text("transaction_id").notNull(),
  confirmedAt: timestamp("confirmed_at"),           // null until merchant confirms (Unit 7)
  confirmedBy: text("confirmed_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}).enableRLS()
```

#### Merchant payment fields

Add to the `merchants` table in `db/schema.ts`:

```ts
bkashNumber: text("bkash_number"),
nagadNumber: text("nagad_number"),
```

#### Drizzle relations additions

Add relations for `orders ? orderItems`, `orders ? paymentConfirmations`, and `orderItems ? products`.

---

### 2. Better Auth Plugin Integration

Update `lib/auth/auth.ts` to add the `anonymous` and `emailOTP` plugins.

#### `anonymous` plugin

```ts
import { anonymous } from "better-auth/plugins"

// In betterAuth({ plugins: [...] })
anonymous({
  emailDomainName: "guest.shopnest.com.bd", // internal placeholder domain
})
```

- The anonymous plugin creates a short-lived session with no credentials.
- The session holds cart + checkout state server-side during guest checkout.
- After order placement the session is either promoted to a registered customer (Unit 9) or discarded.
- **Do NOT** expose `BETTER_AUTH_SECRET` or the `auth` object on the client (Invariant 4). The anonymous session is initiated via a Server Action that calls `auth.api.signInAnonymous()`.

#### `emailOTP` plugin

```ts
import { emailOTP } from "better-auth/plugins"

emailOTP({
  async sendVerificationOTP({ email, otp, type }) {
    // Phone-as-email pattern: phone number encoded as 01XXXXXXXXX@guest.shopnest.com.bd
    // Strip the domain suffix and dispatch via SMS instead.
    const phone = email.split("@")[0]
    await sendSms({
      to: phone,
      message: `Your ShopNest verification code is: ${otp}. Valid for 10 minutes.`,
    })
  },
  otpLength: 6,
  expiresIn: 600, // 10 minutes in seconds
})
```

> **Phone-as-email pattern:** Better Auth's `emailOTP` plugin operates on email addresses. To reuse it for phone OTP, encode the customer phone as `01XXXXXXXXX@guest.shopnest.com.bd`. The `sendVerificationOTP` callback strips the domain and sends an SMS via `lib/sms.ts`. This is an internal detail — never exposed to the customer.

Update `lib/auth/auth-client.ts` to include the matching client-side plugins:

```ts
import { anonymousClient, emailOTPClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  plugins: [anonymousClient(), emailOTPClient()],
})
```

---

### 3. Cart State — Zustand Store

**[NEW FILE]** `lib/cart/cart-store.ts`

Cart state is client-side only. Stored in Zustand with `persist` middleware (localStorage), scoped per merchant subdomain.

```ts
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface CartItem {
  productId: string
  slug: string
  name: string
  pricePaisa: number      // snapshot at time of adding to cart
  stockCount: number      // snapshot — used to enforce max quantity in UI
  imageUrl: string | null // first product image public URL or null
  quantity: number
}

interface CartStore {
  merchantId: string | null
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity"> & { merchantId: string }) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  subtotalPaisa: () => number
}
```

- `addItem`: If item already exists, increments quantity by 1 (capped at `stockCount`). If `merchantId` in store differs from incoming item's merchant, **clear cart first** then add — prevents cross-merchant cart contamination.
- `updateQuantity`: Clamps to `[1, item.stockCount]`.
- Storage key: `shopnest-cart-${merchantId}` — one isolated store per merchant.

**[NEW FILE]** `hooks/use-cart.ts` — re-exports the typed store with convenience selectors.

---

### 4. Cart Icon Integration (Layout)

Backfill the stub in `(storefront)/[subdomain]/layout.tsx` added in Unit 5:

**[NEW FILE]** `components/storefront/CartIconButton.tsx` — `"use client"`:
- Reads `totalItems()` from the Zustand cart store.
- Renders a `ShoppingCart` Lucide icon with a numeric `Badge` from `components/ui` showing item count. Badge is hidden when count is 0.
- Wraps in `<Link href="/cart">`.
- Replace the `{/* TODO Unit 6 */}` comment in `layout.tsx` with `<CartIconButton />`.

---

### 5. "Add to Cart" Action Wiring

Wire the stubs from Unit 5 in `ProductCard` and the product detail page.

**[NEW FILE]** `components/storefront/AddToCartButton.tsx` — `"use client"`:
- Accepts `product: Omit<CartItem, "quantity">` as props.
- Calls `addItem()` from `use-cart.ts` on click.
- Shows a brief "Added ?" success state (1.5 s) via `useState<boolean>`.
- Disabled if `stockCount === 0`.

Update:
- **`ProductCard.tsx`** — replace the `{/* TODO Unit 6 */}` button with `<AddToCartButton product={...} />`.
- **`product/[slug]/page.tsx`** — replace the `console.log` stub with `<AddToCartButton product={...} />`.

---

### 6. Cart Page (`(storefront)/[subdomain]/cart/page.tsx`)

**[NEW FILE]** — `"use client"` (all data from Zustand).

```
md+: grid grid-cols-[1fr_360px] gap-8
mobile: flex flex-col gap-6

Left — Item List:
  <h1>Your Cart</h1>
  {items.length === 0 && <EmptyState icon={ShoppingCart} ... />}
  {items.map(item => <CartItemRow key={item.productId} item={item} />)}

Right — Order Summary Card:
  Subtotal: formatTaka(subtotalPaisa())
  Shipping: Free
  Total:    formatTaka(subtotalPaisa())
  <Button variant="primary" pill onClick={() => router.push("/checkout")}>
    Proceed to Checkout
  </Button>
```

**[NEW FILE]** `components/storefront/CartItemRow.tsx` — `"use client"`:
- Product image thumbnail (48×48, `rounded-md object-cover`).
- Product name (`text-body-strong font-semibold`) + unit price.
- Quantity stepper: `-` / count / `+` buttons. Clamped to `[1, stockCount]`.
- `Trash2` icon remove button ? calls `removeItem(productId)`.

---

### 7. Checkout Page (`(storefront)/[subdomain]/checkout/page.tsx`)

**[NEW FILE]** — `"use client"`. Step managed by `useState<"address" | "payment" | "confirm">`.

Redirect to `/cart` if `items.length === 0` via `useEffect + useRouter`.

#### Step 1: Address + Identity

Fields (TanStack Form + Zod `addressSchema`):
- Full Name (required, min 2)
- Phone Number (required, regex `/^01[3-9]\d{8}$/`)
- Delivery Address (required, min 10 chars)
- City (required)

Below the form — `<CheckoutIdentitySection phone={watchedPhone} />`:

**[NEW FILE]** `components/storefront/CheckoutIdentitySection.tsx` — `"use client"`:
- If the current session has `customer` role ? shows "Continuing as [name]" banner — no OTP needed.
- Otherwise ? shows "Verify your phone" section:
  - "Send OTP" button ? calls `sendCheckoutOtp(phone)` Server Action.
  - 6-digit OTP input (6 separate `Input` fields with auto-focus-advance) + "Verify" button ? calls `verifyCheckoutOtp(phone, otp)` Server Action.
  - 60-second countdown timer before "Resend OTP" enables.
- Phone must be verified before Step 1 can advance.

#### Step 2: Payment Instructions

Shown after the order row is pre-created in the DB:

```
Payment method toggle: "bKash" | "Nagad" pill buttons
Payment Instructions Card:
  "Send ?{total} to {merchantBkashNumber or merchantNagadNumber}"
  "In the payment reference/note, enter: #{orderId}"
  Order number in font-mono, prominent, easy to copy

Transaction ID field (required, min 6 chars)
"Confirm Order" button ? calls submitPayment() Server Action
```

#### Step 3: Confirmation

```
? icon (large)
"Order Placed!"
"Order #{orderId}"
"The store will SMS you once your payment is confirmed."
"Continue Shopping" pill ? navigates to storefront root
clearCart() called in useEffect on mount of this step
```

---

### 8. Validation Schemas

**[NEW FILE]** `lib/validations/checkout.ts`

```ts
import { z } from "zod"

export const addressSchema = z.object({
  deliveryName:    z.string().min(2, "Name must be at least 2 characters"),
  deliveryPhone:   z.string().regex(/^01[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number"),
  deliveryAddress: z.string().min(10, "Please enter your full delivery address"),
  deliveryCity:    z.string().min(2, "City is required"),
})

export const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be numeric"),
})

export const paymentSchema = z.object({
  paymentMethod: z.enum(["bkash", "nagad"]),
  transactionId: z.string().min(6, "Enter the transaction ID from your bKash/Nagad app"),
})
```

---

### 9. Server Actions

**[NEW FILE]** `app/(storefront)/[subdomain]/checkout/actions.ts`

All actions must:
1. Read `x-merchant-id` from `headers()` — never from params (Invariant 1).
2. Validate input with Zod before any DB call.
3. Call `auth.api.getSession({ headers })` to resolve `userId` (null for anonymous guests).

```ts
"use server"

// Initiates phone OTP — encodes phone as phone@guest.shopnest.com.bd for emailOTP plugin
export async function sendCheckoutOtp(phone: string): Promise<{ success: boolean; error?: string }>

// Verifies phone OTP; establishes anonymous session if no session exists
export async function verifyCheckoutOtp(phone: string, otp: string): Promise<{ success: boolean; error?: string }>

// Validates address form, calls createOrder(), stores orderId in signed cookie
export async function submitAddress(data: z.infer<typeof addressSchema>): Promise<{ orderId: string; totalPaisa: number } | { error: string }>

// Validates payment form, calls attachPaymentConfirmation(), clears checkout cookie
export async function submitPayment(data: z.infer<typeof paymentSchema>): Promise<{ success: boolean; error?: string }>
```

---

### 10. Order Creation — `db/queries/orders.ts`

**[NEW FILE]** `db/queries/orders.ts`

#### `createOrder` — atomic Drizzle transaction

```ts
export async function createOrder(params: {
  merchantId: string        // always from proxy headers (Invariant 1)
  userId: string | null     // null for guest
  guestPhone: string | null
  deliveryName: string
  deliveryPhone: string
  deliveryAddress: string
  deliveryCity: string
  items: Array<{ productId: string; quantity: number }>
}): Promise<{ orderId: string; totalPaisa: number } | { error: string }>
```

Transaction steps:

```
1. SELECT ... FROM products WHERE id IN (...) AND merchant_id = $merchantId
   AND is_published = true AND deleted_at IS NULL
   FOR UPDATE                          ? row-level lock prevents concurrent oversell

2. For each item:
   - product not found ? rollback with error
   - product.stockCount < item.quantity ? rollback with stock error (Invariant 2)

3. Compute totalPaisa = sum(product.pricePaisa * item.quantity)

4. INSERT INTO orders (id, merchant_id, user_id, guest_phone, status='pending_payment', ...)

5. INSERT INTO order_items (snapshot productName + unitPricePaisa) (Invariant 3)

6. For each item:
   UPDATE products
   SET stock_count = stock_count - $quantity
   WHERE id = $productId
     AND merchant_id = $merchantId
     AND stock_count >= $quantity      ? final DB-layer guard (Invariant 2)

   If UPDATE affects 0 rows ? rollback (concurrent race lost)
```

#### `attachPaymentConfirmation`

```ts
export async function attachPaymentConfirmation(params: {
  orderId: string
  merchantId: string  // from proxy headers (Invariant 1)
  paymentMethod: "bkash" | "nagad"
  transactionId: string
}): Promise<{ success: boolean; error?: string }>
```

- Inserts into `payment_confirmations` with `confirmedAt = null`.
- Merchant confirms manually in Unit 7.
- INSERT triggers `on-order-created` DB webhook ? Edge Function ? SMS to merchant (Unit 8).

---

### 11. Proxy Header Additions

`proxy.ts` must forward the new merchant payment fields as request headers:

```ts
requestHeaders.set("x-merchant-bkash", merchant.bkashNumber ?? "")
requestHeaders.set("x-merchant-nagad", merchant.nagadNumber ?? "")
```

The checkout page reads these server-side and passes them as props to the payment step component.

---

## Dependencies

| Package | Purpose | Status |
|---------|---------|--------|
| `better-auth` — `anonymous` plugin | Guest sessions for checkout | ?? Add to `auth.ts` |
| `better-auth` — `emailOTP` plugin | Phone OTP via SMS for identity verification | ?? Add to `auth.ts` |
| `zustand` | Client-side cart state with localStorage persistence | ?? Install |
| `@tanstack/react-form` | Checkout address + payment forms | ? Unit 4 |
| `zod` | Checkout schema validation | ? Unit 4 |
| `drizzle-orm` | DB queries and transactions | ? Unit 2 |
| `next` (cookies, headers, Server Actions) | Cookie for order continuity across steps | ? Unit 1 |

**Install command:**
```bash
pnpm add zustand
```

> `crypto.randomUUID()` is used for primary key generation (native in Node 19+ / Next.js App Router) — no extra package needed.

---

## Verification Checklist

### Auth & Session

- [x] Visiting `/checkout` without any session creates an anonymous Better Auth session (`sessions` table shows a row with the anonymous user).
- [x] Entering a phone number and clicking "Send OTP" dispatches an SMS (check `sms_logs` table for a record with the correct phone).
- [x] Entering the correct 6-digit OTP verifies the session and enables Step 1 to advance.
- [x] Entering an incorrect OTP shows inline error: "Invalid verification code."
- [x] The "Resend OTP" button is disabled for 60 seconds after initial send.
- [x] A logged-in registered customer skips the OTP step entirely and sees "Continuing as [name]".

### Cart

- [x] Clicking "Add to Cart" on a product card adds it to the Zustand store (check localStorage key `shopnest-cart-{merchantId}`).
- [x] The cart icon badge in the storefront header shows the correct total item count.
- [x] Adding the same product twice increments quantity — does not create a duplicate row.
- [x] The quantity stepper clamps at `stockCount` — cannot exceed available stock in the cart UI.
- [x] Removing all items shows the `EmptyState` component.
- [x] Refreshing the page retains cart contents (Zustand `persist` middleware).
- [x] Visiting a different merchant's storefront starts with a clean, separate cart.

### Checkout Flow

- [x] Navigating to `/checkout` with an empty cart redirects immediately to `/cart`.
- [x] The stepper shows `Address ? Payment ? Confirm` with the correct active highlight.
- [x] Submitting an invalid BD phone number (e.g. `01100000000`) shows a Zod validation error inline beneath the field.
- [x] Submitting Step 1 creates an `orders` row in the DB with `status = 'pending_payment'`.
- [x] The Payment step displays the merchant's bKash or Nagad number from proxy headers.
- [x] The order number shown in the payment instructions matches `orders.id` in the DB.
- [x] Submitting a transaction ID creates a `payment_confirmations` row with `confirmed_at = null`.
- [x] The Confirmation step (Step 3) is shown after successful submission with the correct order number.
- [x] `clearCart()` is called after successful submission — cart is empty post-checkout.
- [x] "Continue Shopping" CTA navigates back to the storefront catalog root.

### Stock Guard (Invariant 2)

- [x] Set a product's `stock_count` to 1. Add quantity 2 to cart. `createOrder()` returns an error: `"[Product] only has 1 left in stock."` — no order row is created.
- [x] With `stock_count = 1`, simulate two near-simultaneous checkout requests for the same product. Only one succeeds; the other receives the stock error. `products.stock_count` never goes below 0.
- [x] After a successful order, `products.stock_count` is decremented by the ordered quantity in the DB.
- [x] A product with `stock_count = 0` shows as out of stock on the storefront and its "Add to Cart" button is disabled — it cannot be added to cart.

### Price Snapshotting (Invariant 3)

- [x] After an order is created, change the product's price in the merchant dashboard. The `order_items.unit_price_paisa` for the existing order remains unchanged.
- [x] The order total displayed is computed from `order_items` rows (snapshotted price × quantity), not from current `products.pricePaisa`.

### Security & Invariants

- [x] The `x-merchant-id` used in all Server Actions is read from `headers()` (proxy-injected) — never from request body or URL params (Invariant 1).
- [x] No `auth` object or `BETTER_AUTH_SECRET` is imported in any client component (Invariant 4).
- [x] A crafted POST to a checkout Server Action with a spoofed `merchantId` in the body is ignored — the action uses only the proxy header value.

