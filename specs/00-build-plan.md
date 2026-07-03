# ShopNest — Build Plan

Based on the provided architecture and project overview, here is the logical sequence of units. This plan introduces dependencies just-in-time, merges adjacent tasks without standalone visible results (like pure DB schema) with their corresponding UI, ensures every unit produces a tangible outcome within a specific boundary, and uses the latest stack paradigms (e.g., Next.js 16+ `proxy.ts`).

### 1. Project Setup & Landing Page
* **What it builds:** Next.js 16+ App Router initialization, Tailwind CSS v4+ setup, Lucide React icons, and the foundational `components/ui` library (buttons, inputs, layouts). Implements the `(marketing)/page.tsx` public-facing landing page.
* **Dependencies:** None.

### 2. Authentication Flow & Core Database
* **What it builds:** Supabase Postgres and Drizzle ORM configuration. Defines the core `db/schema.ts` (merchants, users). Integrates Better Auth (`lib/auth/auth.ts`) with the email/password provider. Implements the `(auth)/login` and `(auth)/register` UI.
* **Dependencies:** Unit 1 (UI components).

### 3. Merchant Onboarding & Subdomain Proxy
* **What it builds:** The `(auth)/onboarding` flow capturing store name and subdomain. Implements `proxy.ts` (Next.js 16+) to resolve subdomains from the Host header, check the Better Auth server session, and route traffic correctly to `(storefront)` or `(dashboard)`.
* **Dependencies:** Unit 2 (DB schema, Better Auth).

### 4. Dashboard Foundation & Product Management
* **What it builds:** Introduces TanStack Query v5+, TanStack Form v1, and Zod v4. Builds the auth-guarded `(dashboard)/layout.tsx` shell. Implements `(dashboard)/products` routes for listing, creating, and editing products. Configures Supabase Storage for product image uploads.
* **Dependencies:** Unit 3 (Proxy routing, Onboarding).

### 5. Storefront Product Catalog
* **What it builds:** The `(storefront)/layout.tsx` (which reads the merchant context passed by `proxy.ts`). Implements the customer-facing `(storefront)/page.tsx` (catalog with live stock logic) and `(storefront)/product/[slug]` (product details).
* **Dependencies:** Unit 4 (Products exist in DB), Unit 3 (`proxy.ts` routing).

### 6. Cart & Guest Checkout Flow
* **What it builds:** Integrates Better Auth `anonymous` and `emailOTP` plugins. Builds client-side cart state, `(storefront)/cart`, and `(storefront)/checkout`. Implements secure order creation in `db/queries/orders.ts` utilizing Drizzle transactions with a strict `WHERE stock_count >= quantity` guard.
* **Dependencies:** Unit 5 (Storefront Catalog), Unit 2 (Better Auth).

### 7. Dashboard Order Management
* **What it builds:** The `(dashboard)/orders` list and detail views. Implements server actions allowing merchants to review bKash/Nagad TxIDs, confirm payments, and progress order statuses (Pending → Processing → Shipped → Delivered).
* **Dependencies:** Unit 6 (Order creation logic), Unit 4 (Dashboard shell).

### 8. Realtime Sync
* **What it builds:** Implements the Supabase Realtime client within the dashboard so the order list updates instantly without polling, automatically adding visual highlights to newly placed orders.
* **Dependencies:** Unit 7 (Dashboard Orders UI), Unit 6 (Order creation).

### 9. Customer Order Tracking & Email Receipts
* **What it builds:** The `(storefront)/orders` order tracking portal. Implements logic to promote anonymous guest sessions to registered customers. Adds Supabase Edge Functions (`on-payment-confirmed`, `on-order-status-changed`) using Resend to dispatch transactional emails to customers.
* **Dependencies:** Unit 6 (Checkout Flow), Unit 8 (Realtime Sync).

### 10. Settings, Limits & Discount Codes
* **What it builds:** The `(dashboard)/settings` (store config, low stock thresholds) and `(dashboard)/billing` pages. Implements Discount Codes CRUD (Growth plan only) and strict server-side enforcement of Starter plan limits (max 50 products, 200 orders).
* **Dependencies:** Unit 4 (Dashboard shell), Unit 7 (Orders logic).

### 11. Super Admin Panel & 2FA
* **What it builds:** Integrates the Better Auth `twoFactor` (TOTP) and `admin` plugins. Builds the heavily restricted `(admin)/layout.tsx` shell. Implements views for the super admin to list merchants, suspend stores, override trials, and manually record subscription payments.
* **Dependencies:** Unit 10 (Subscriptions), Unit 2 (Better Auth).

### 12. Subscriptions, Payments & Invoices
* **What it builds:** Extends the billing engine. Allows merchants to choose a plan during onboarding, submit manual subscription payments (bKash/Nagad) from the billing dashboard, and view/print invoices. Provides super admins the tools to verify payments and collect multiple months at once. Enforces storefront access controls for active vs. offline stores.
* **Dependencies:** Unit 11 (Super Admin Panel).

### 13. Dashboard Key Metrics
* **What it builds:** Connects the merchant dashboard metrics to the database. Implements queries for Total Sales (completed payments), Active Products, and Active Orders. Updates the onboarding checklist to dynamically track product count and bKash/Nagad configuration. Displays subscription plan and plan limits dynamically.
* **Dependencies:** Unit 10 (Settings & Limits), Unit 7 (Orders logic).

### 14. Category Management & Advanced Products
* **What it builds:** Implements the `categories` database schema and CRUD operations in `db/queries`. Builds the `(dashboard)/categories` UI for category management. Updates the `(dashboard)/products` creation/edit forms to include category selection and a multi-select for product promotions (e.g., featured, new arrival). Enforces category limits based on the merchant's subscription plan.
* **Dependencies:** Unit 13 (Dashboard Key Metrics), Unit 4 (Product Management).

### 15. Storefront Editor & Dynamic Storefront
* **What it builds:** Extends the `merchants` schema with `hero_image_url`, `custom_faqs`, `social_links`, and display metadata. Builds the "Storefront Layout" tab within `(dashboard)/settings` with a structured form. Updates the `(storefront)/page.tsx` landing page to render the custom hero image, dynamically query and display Featured and New Arrival product bands, display the custom FAQs, and updates the footer with social links.
* **Dependencies:** Unit 14 (Advanced Products), Unit 10 (Settings).

### 16. Advanced Checkout: Shipping Zones & "Buy Now"
* **What it builds:** Redesigns the delivery fee system into an industry-standard **Zone → District** hierarchy (matching Shopify/WooCommerce). Merchants create named shipping zones (e.g., "Inside Dhaka"), bulk-assign Bangladesh districts to each zone via a division accordion with checkboxes, set per-zone delivery fees, and configure optional free-shipping thresholds per zone. A merchant-level fallback fee is applied to districts not in any zone. Database schema introduces `shipping_zones` and `shipping_zone_districts` tables, plus `fallback_delivery_charge_paisa` on `merchants`. The storefront checkout resolves the correct zone fee (or fallback) from the selected district and shows a free-shipping message when the threshold is met. Also implements the `useCheckoutStore` Zustand store (with `persist` middleware) for the "Buy Now" single-item checkout bypass flow, with a "Buy Now" button on product cards and the product detail page.
* **Dependencies:** Unit 15 (Dynamic Storefront), Unit 6 (Cart & Checkout).

### 17. Asynchronous Telegram Notification Engine
* **What it builds:** A zero-cost, multi-tenant Telegram notification system for real-time merchant order alerts. Adds `telegram_chat_id` column to `merchants`, creates a generic `notification_queue` table (channel-agnostic, supports future SMS), and a `notification_preferences` table for Pro plan per-event channel routing. A Supabase DB Webhook on `orders` INSERT triggers the `on-order-created-notify` Edge Function which enqueues a message if the merchant has Telegram configured. A second Edge Function (`dispatch-notifications`) is invoked by `pg_cron` every 5 seconds to claim pending messages using `SELECT ... FOR UPDATE SKIP LOCKED`, send them to Telegram at a throttled rate of 25 req/s, and handle HTTP 429 retry-after backoff. Implements a "Notifications" tab in `(dashboard)/settings` where merchants paste their Telegram Chat ID, receive a live test message on save, and (Pro plan only) see a per-event channel routing table. Telegram is fully opt-in — stores without a Chat ID are unaffected.
* **Dependencies:** Unit 6 (Order creation — `orders` table), Unit 10 (Settings page — tab structure), Unit 12 (Subscriptions — plan check for Pro UI gating).

---

## V2

### 18. DB-Driven Subscription Plan Maker
* **What it builds:** Migrates plan configuration from hardcoded code constants to a fully database-driven model. Introduces a `subscription_plans` table with columns: `id`, `name`, `slug` (e.g. `starter`, `growth`, `pro`), `price_paisa`, `is_active`, `is_archived`, and a JSONB `features` column holding all limit and feature flags (e.g. `max_products`, `max_orders_per_month`, `max_categories`, `max_images_per_product`, `image_size_limit_mb`, `discount_codes`, `telegram_notifications`, `cod`). A migration seeds the existing three plans (Starter ৳499, Growth ৳999, Pro ৳1499) with their current feature sets. The `subscriptions` table gains a `plan_id` FK referencing `subscription_plans`. All hardcoded plan-limit checks across ~10+ files are refactored to read from the plan record fetched at request time. In the super admin panel, a new "Plans" section lets the super admin create new plan tiers, edit any plan's name, price, and feature flags (via a structured JSONB form), and archive plans (archived plans are hidden from the onboarding plan picker but remain valid for merchants already on them).
* **Dependencies:** Unit 12 (Subscriptions engine), Unit 11 (Super Admin Panel).

### 19. Subscription Plan Changes
* **What it builds:** Implements safe, merchant-transparent plan-switching: instant plan changes by the super admin, hard downgrade blocking when the merchant's current resource counts exceed the target plan's limits (products, categories, discount codes, images per product), grandfathered limit snapshots stored as `snapshot_*` columns on `subscriptions` so existing subscribers are not retroactively affected when a plan's configuration is edited, and an automated Resend email to the merchant whenever their plan is changed. Adds `changeMerchantPlanAction` server action, a `validateDowngrade` utility in `lib/plans/`, a `writeSubscriptionSnapshot` query helper, and a new "Change Plan" section in the super admin subscription manager drawer. Also stores a `features_at_payment_time` snapshot in the pending `subscription_payments` row to lock in limits at the exact moment of payment submission (enforced during verification, with fallback to live plan features if missing), and displays an amber plan-drift warning badge in the super admin subscription verification table and verify dialog if a plan is edited between submission and verification.
* **Dependencies:** Unit 18 (DB-driven plans, `subscription_plans` table, `lib/plans/` utilities).

### 20. Merchant Exemptions
* **What it builds:** Adds three nullable override columns to the `subscriptions` table: `plan_override_id` (FK to `subscription_plans` — forces a specific plan regardless of what the merchant paid for), `price_override_paisa` (integer, 0 = fully free), and `override_reason` (text note for internal record-keeping). All plan-limit resolution logic (from Unit 18) is updated to prefer `plan_override_id` over the regular `plan_id` when present. In the super admin subscription manager drawer (already built in Unit 11), an "Exemption" section allows the super admin to set or clear an override: select any plan from a dropdown, enter a custom monthly price (with a "Free / ৳0" shortcut toggle), and add an optional reason note. The override is entirely invisible to the merchant — their billing page renders the normal plan UI using the effective (overridden) plan name and limits.
* **Dependencies:** Unit 19 (Subscription Plan Changes — snapshot model), Unit 18 (DB-driven plans).

### 21. Subscription Discount Codes
* **What it builds:** Introduces a `subscription_promo_codes` table: `id`, `code` (unique, uppercase), `discount_type` (`percent` | `fixed`), `discount_value`, `applicable_plan_id` (nullable FK — restricts the code to a specific plan tier), `max_redemptions` (nullable global cap), `redemptions_count` (counter), `expires_at` (nullable), `is_active`. A `subscription_promo_redemptions` table records each use: `promo_code_id`, `merchant_id`, `redeemed_at`, `subscription_id` — enforcing the one-per-merchant uniqueness constraint at the DB level via a unique index on `(promo_code_id, merchant_id)`. In the super admin panel, a new "Promo Codes" tab lists all codes, shows live redemption counts vs. caps, and provides create/deactivate actions. On the merchant side, the billing payment wizard gains a "Have a promo code?" collapsible field that validates the code against the server (checking plan compatibility, expiry, global cap, and per-merchant uniqueness) and applies the discount to the displayed amount before the merchant proceeds to pay.
* **Dependencies:** Unit 18 (DB-driven plans), Unit 20 (Exemptions — subscription record model), Unit 12 (Billing wizard UI).

### 22. Product Variants
* **What it builds:** Extends the product data model to support a **Simple vs. Variant** product type toggle. Simple products (the existing behavior) are unchanged. Variant products introduce three new tables: `product_options` (e.g. "Size", "Color" — ordered, per-product), `product_option_values` (e.g. "S", "M", "L" — ordered, per-option), and `product_variants` (the SKU matrix: each row is one combination of option values, with its own `price_paisa`, `compare_at_price_paisa`, `stock_count`, `sku` (optional, unique per merchant), and a `variant_images` join table to Supabase Storage). In the dashboard product create/edit form, the merchant adds option types and their values; on confirming options, the UI auto-generates all combinations into an editable table where the merchant fills in price, compare-at-price, stock, SKU, and uploads per-variant images row-by-row. On the storefront product detail page, variant selectors (rendered as button groups per option type) filter the matrix to the selected combination and update the displayed price, compare-at-price, stock badge, and image gallery. Checkout and cart are updated to carry `variant_id` instead of `product_id` alone; order line items record the resolved variant snapshot (option labels + values) for historical display. The `stock_count` decrement on order creation applies to the variant row. Plan limits for max products count parent products only (not individual variants).
* **Dependencies:** Unit 4 (Product Management dashboard shell), Unit 5 (Storefront product detail page), Unit 6 (Cart & Checkout line items), Unit 18 (plan limits — image caps apply per variant).

### 23. Product SEO
* **What it builds:** Adds an `seo` JSONB column to the `products` table containing `{ meta_title, meta_description, slug, og_image_url }`. The dashboard product form gains a collapsible "SEO" panel (below the main fields) with inputs for meta title, meta description, a slug field (auto-populated from the product name, editable, validated for uniqueness per merchant), and an OG image uploader (stored in Supabase Storage, separate from the product gallery). The storefront product detail page route changes from `/product/[id]` to `/product/[slug]`, with `generateMetadata()` populating `<title>`, `<meta name="description">`, `<meta property="og:image">`, and canonical URL. A Next.js redirect is added so old `/product/[id]` URLs permanently redirect (301) to the correct slug URL. The slug field is enforced unique per merchant at the DB level via a partial unique index. If a product has no custom slug, the system falls back to a URL-safe version of the product name.
* **Dependencies:** Unit 22 (Variants — product detail page already updated), Unit 5 (Storefront product detail route).

### 24. Cash on Delivery (COD)
* **What it builds:** Adds `cod_enabled` (boolean, default `false`) to the `merchants` table. In `(dashboard)/settings`, a new toggle in the Payment Methods section lets the merchant enable or disable COD for their storefront. On the storefront checkout page, when `cod_enabled` is true for the merchant, a "Cash on Delivery" payment method option appears alongside bKash and Nagad. Selecting COD hides the transaction ID field and payment instructions, replacing them with a delivery note ("Pay in cash when your order arrives"). Order creation server action is updated to accept `payment_method: 'cod'` — COD orders are created with status `Processing` (payment already "confirmed" by nature of COD) rather than `Pending Payment Confirmation`. The merchant's order list shows a "COD" badge on such orders. No transaction ID verification step is required for COD orders in the merchant workflow.
* **Dependencies:** Unit 6 (Cart & Checkout flow), Unit 10 (Settings page tab structure), Unit 18 (DB-driven plan features — `cod` flag controls whether COD is allowed per plan, defaulting to enabled on all plans).
