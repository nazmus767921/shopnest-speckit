# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- None

## Current Goal

- All specifications completed successfully.

## Completed

- **Core Setup & Auth**: Next.js 16+, Tailwind CSS v4, PostgreSQL/Drizzle, Better Auth (email/password, anonymous guest, phone OTP, admin 2FA).
- **Subdomain Routing & Onboarding**: Proxy-based subdomain storefront isolation, immutable subdomains, error templates for nonexistent/suspended stores.
- **Product & Category Catalog**: Category CRUD, dynamic catalog with promotions/categories filtering, media upload to Supabase Storage, inline stock updates, plan-limit enforcement (50 products, 5 categories on Starter).
- **Cart & Checkout Flow**: Multi-tenant isolated Zustand carts, guest checkout (phone OTP), transaction-locked orders with stock checks, and "Buy Now" direct flow.
- **Shipping & Delivery Zones**: Geographic shipping zones mapped by divisions, free shipping thresholds, and shipping status tracker.
- **Order Processing & Sync**: Real-time merchant dashboard updates via Supabase Realtime, order status progression, and transactional email logs using Resend.
- **Billing & Settings Dashboard**: Split-column subscription limits dashboard, 3-step manual bKash/Nagad billing wizard, and drag-and-drop Storefront Layout FAQ/Hero editor.
- **Super Admin Workspace**: Overview metrics (MRR/revenue), pending payments verification queue, subscription manager drawer, and trial override.
- **UI Design & Testing**: Mobile-first bottom nav, high-density tables/media grids, custom Toast component, shadowless flat design implementation, and Vitest test suite configuration.
- **Asynchronous Telegram Notification Engine (Unit 17)**: `telegram_chat_id` column on merchants, `notification_queue` and `notification_preferences` tables with migration applied. `on-order-created-notify` DB Webhook Edge Function enqueues messages. `dispatch-notifications` pg_cron worker dispatches at ≤25 req/s with 429 retry-after handling and stale-row recovery. "Notifications" tab added to dashboard settings with TanStack Form, sync test message on save, and disconnect flow. API routes at `POST/DELETE /api/dashboard/notifications/telegram`. Zod validation for Chat ID format. `TELEGRAM_BOT_TOKEN` documented in env.
- **Cache Components & Suspense Loading (Unit 19)**: Fully enabled and optimized Next.js Cache Components and Suspense loading across storefront and dashboard layouts/pages. Replaced dynamic-route segment opt-outs (`export const instant = false`) with static prefetching (`unstable_instant = { prefetch: 'static' }`), deferring request-time and DB accesses into Suspense boundaries with skeleton fallback states.

- **DB-Driven Subscription Plan Maker (Unit 18)**: Migrate plan configurations to database, refactor checks, build plans management views, update onboarding and pricing pages, and align merchant billing UI / products limit validations dynamically.
- **Subscription Plan Changes (Spec 19)**: Instant admin-triggered plan switching, hard downgrade validation blocking (based on products, categories, discount codes, images), limit snapshot grandfathering on subscriptions, nullable email logs reference, reusable Alert UI component, and automated email notification via Resend on plan updates.
- **Plans Forms & Pages Revamp**: Overhauled subscription plan creation (`/admin/plans/new`) and editing (`/admin/plans/edit/[id]`) pages. Replaced plain inputs with iOS-style switches, custom increment/decrement controls, quick pricing presets, and modern interactive feature capability cards. Aligned typography and layout with the transactional design guidelines.

- **Subscription Limit Alignment (Notifications & Discounts)**: Refactored `/dashboard/settings` Notifications tab, `/dashboard/discounts` page, and the Telegram API route to dynamically resolve subscription plan feature flags (`discount_codes` and `telegram_notifications`) via `getMerchantPlan()` instead of hardcoded checks.
- **Telegram Notification UX**: Implemented a confirmation dialog intercepting the "Save & Send Test Message" button to explicitly ensure the merchant has started a chat with `@shopnest_bot` before connecting, mitigating silent failure scenarios.

- **Grandfathering Bug Fixes (Subscription Snapshot Integrity)**: Fixed 3 bugs in the plan snapshot/grandfathering system. Added `features_at_payment_time jsonb` column to `subscription_payments` (migration `0021_lively_arclight.sql` applied). `submitPaymentAction` now snapshots plan features at submission. `verifySubscriptionPaymentAction` now uses `payment.featuresAtPaymentTime` for snapshot writing (with fallback to live plan for legacy rows) and no longer hard-blocks verification when usage exceeds post-edit limits. `recordSubscriptionPayment` (admin direct record) also snapshots and writes via `writeSubscriptionSnapshot`. Admin verify dialog now shows an amber plan-drift warning when the plan was edited between submission and verification.
- **Improved Input Component (Number Type & Slots)**: Upgraded the standard `Input` primitive component at `components/ui/primitives/Input.tsx` to automatically render as a custom styled NumberField with custom stepper buttons when `type="number"`. Created click-and-hold/tap-and-hold timer mechanisms for continuous incrementing/decrementing, implemented a synchronization hook to keep value `0` fully erasable in controlled inputs, and added `leftIcon` and `rightIcon` props to easily render icons inside the input container for both text and number inputs. Built purely from scratch with standard Tailwind, Lucide React, and vanilla DOM event dispatchers.


## In Progress

- None (Phase 8 Polish tasks remaining — T066–T090, 14 tasks)

## Completed This Session

- **Product Variants & Custom Metadata (Spec 20)**:
  - 6 new DB tables (product_attributes, attribute_options, product_variants, variant_attribute_links, variant_images, product_metadata)
  - Modified products (has_variants, variant_generation, metadata_count) and order_items (variant_id, variant_label)
  - Migration 0022 applied successfully
  - Pure functions: generateVariantMatrix, selectVariantForOptions, SKU generation, metadata CRUD
  - 29 passing tests (matrix generation, SKU patterns, variant selection, Zod validation)
  - Server Actions: saveProductAttributesAction, updateVariantAction, saveProductMetadataAction
  - Dashboard components: AttributeEditor, VariantRowEditor, VariantsSection, MetadataEditor, MetadataSection
  - Storefront components: ProductMetadata, VariantSelector, VariantPriceDisplay, VariantProductClient
  - Cart store extended with variantId/variantLabel, variant-aware item matching
  - Checkout flow writes variant_id/variant_label into order_items, decrements variant stock
  - useVariantAvailability TanStack Query hook for live stock polling
  - New product page now redirects to edit page after creation so user can configure variants/metadata
  - **Phase 5 (US3 — Cart & Checkout) COMPLETE**: All 11 tasks done (T037-T047)
  - **UX Redesign**: VariantSelector label/select now linked via htmlFor/id (accessibility fix per FR-017)
  - **Validation fix**: addressSchema now includes variantId/variantLabel (was being silently stripped by Zod)
  - **66 passing tests** across 9 test files (T039-T041 tests now green)
  - **Spec remediations applied**: 7 HIGH issues from analysis resolved (save model, ±% semantics, FR-017, US5 SC3/SC4, FR-002 quantified, etc.)

## Next Up

- Remaining: **Variant image upload** (T058, T062-T064) — Supabase Storage integration for per-variant images
- Remaining: **Phase 8 Polish** (T066-T090) — chip validation, keyboard nav, responsive, pagination, undo, accessibility, DESIGN.md audit

## Open Questions

- None.

## Architecture Decisions

- Excluded `context` directory from TypeScript check in `tsconfig.json` because it contains specifications and database reference files which are not active runtime elements, preventing initial build failures due to uninstalled database dependencies.
- Excluded `supabase` directory from Next.js compilation in `tsconfig.json` to prevent conflicts between Next.js Node compiler configurations and Deno Edge Function specific imports (such as `https://` imports and Deno globals).
- Refactored spacing system in `globals.css` and `DESIGN.md` to use Tailwind CSS v4's default numeric spacing scale rather than custom named tokens to avoid namespace collisions with layout width and container constraints.
- Implemented strict "No Shadows Rule", completely removing all shadow design token variables (`--shadow-level-1` through `--shadow-level-4`) from `globals.css` and deleting the "Elevation & Depth" section in `DESIGN.md` in favor of a flat design aesthetic.
- Removed all shadow utility class names (`shadow-level-*`, `shadow-inner`) from all components (Cards, Inputs, Navbar, Page templates) to enforce this layout boundary.

## Session Notes

- Set up schemas, queries, and onboarding pages with subdomain validation checks.
- Implemented product/category CRUD, Supabase storage uploads, and storefront catalog.
- Added checkout verification, transaction-safe ordering, and Resend notifications.
- Built merchant billing controls, discount code settings, and superadmin collection queue.
- Completed responsive layout revamps (bottom navigation, product tables, settings tabs, and billing drawer).
- Integrated division-based shipping zones, custom toast notifications, and resolved typescript/compiler warnings.
- Moved "Pathao / Steadfast / Paperfly delivery integration" from V2 to V3 scope.
- Configured Telegram webhook `on-order-created-notify` to trigger on `payment_confirmations` INSERT to accurately capture payment details and TxID, and refined dashboard order redirection links.
- Resolved TypeScript compiler errors in SubscriptionsClient (missing targetPlanId property on PaymentHistoryItem) and scratch-test.ts (RowList mapping).
- Resolved Next.js Cache Components "/dashboard" blocking route prerender error by explicitly marking layout.tsx files (dashboard, admin, storefront, onboarding) as dynamic via `export const instant = false`.
- Updated `/dashboard/products` page to dynamically check and disable the "Add Product" button when the merchant reaches their plan's maximum active products limit.
- Refactored `SubscriptionOverview` and `SubmitPaymentForm` components in `/dashboard/billing` to fetch and render dynamic pricing, limits, and features dynamically from the database plans instead of hardcoding starter/growth values.
- Resolved uncached connection/header reads by replacing `unstable_instant = { prefetch: 'static' }` with `export const instant = false` in Layout/Page files where request-time headers/sessions are read.
- Resolved TypeScript compiler errors in SubmitPaymentForm and SubscriptionOverview by correcting PlanItem interface to include isArchived and allowing nullable values (number | null) for max_images_per_product and image_size_limit_mb.
