# ShopNest — Project Overview

## Overview

ShopNest is a multi-tenant e-commerce SaaS platform built specifically for Bangladeshi small and medium clothing boutiques that currently operate through Facebook and other social platforms. It gives each merchant a branded subdomain storefront (e.g. `nihas-boutique.shopnest.com.bd`) where their customers can browse products, place orders, and submit bKash/Nagad payment confirmations — replacing the chaotic, manual inbox-order workflow with a structured, trackable system. Merchants manage everything through a mobile-first dashboard: confirming payments, updating order statuses, and monitoring stock levels. Customers get real-time order tracking without needing to DM the merchant. ShopNest is offered on a 7-day free trial followed by a monthly subscription of ৳499 (Starter), ৳999 (Growth), or ৳1499 (Pro), with subscription payments collected manually via bKash/Nagad in v1.

---

## Goals

1. Give clothing boutique owners doing ৳5L+/month through Facebook a professional, branded storefront without requiring any technical knowledge to set up or operate.
2. Replace manual Facebook DM order management with a structured order dashboard that shows new orders, pending payment confirmations, and order fulfillment status in one place.
3. Eliminate the payment confirmation chaos by giving customers a structured checkout flow where they submit their bKash/Nagad transaction ID, and merchants confirm it in one click.
4. Reduce customer service load on merchants by giving customers self-serve order status tracking via their account or phone number.
5. Keep merchant inventory accurate by tracking stock per product.
6. Generate reliable recurring revenue through a 3-tier subscription model (Starter, Growth, Pro), with manual bKash/Nagad collection in v1.
7. Ship a focused, production-ready v1 in 1–3 weeks with one developer.

---

## Core User Flow (Start to Finish)

### Merchant Onboarding
1. Merchant visits `shopnest.com.bd` and clicks "Start Free Trial."
2. Merchant registers with email and password or Google OAuth.
3. Merchant enters store name and chooses a subdomain (e.g. `nihas-boutique`).
4. ShopNest provisions `nihas-boutique.shopnest.com.bd` via Next.js proxy subdomain routing.
5. Merchant adds products: name, description, price, stock count, and product images (stored in Supabase Storage).
6. Merchant shares their storefront link on Facebook, WhatsApp, and other channels.

### Customer Order Flow
1. Customer visits `nihas-boutique.shopnest.com.bd`.
2. Customer browses the product catalog with live stock availability.
3. Customer adds items to cart and proceeds to checkout.
4. At checkout, customer either logs into their account or enters their phone number and verifies via OTP (guest checkout).
5. Customer enters their delivery details and selects their City from a combobox. The system calculates and displays the city-based delivery charge.
6. Customer selects bKash or Nagad as payment method and sees the merchant's bKash/Nagad number, and QR code (Bkash payment or Nagad payment - which can be scanned by the customer to pay), and the instructions to pay on selected payment method.
7. Customer sends payment manually via bKash/Nagad on their phone, and insert the order number in the ref field or note field of bkash or nadad while making payment.
8. Customer returns to checkout, enters their bKash/Nagad transaction ID, and submits the order.
9. Order is created in the system with status: **Pending Payment Confirmation.**

### Merchant Order Management
1. Merchant sees the new order appear instantly in the dashboard orders list with a visual highlight.
2. Merchant opens the ShopNest dashboard on mobile or laptop.
3. Merchant sees the new order in the dashboard with the submitted transaction ID.
4. Merchant verifies the transaction ID against their bKash/Nagad app.
5. Merchant clicks "Confirm Payment" — order status updates to **Processing.**
6. Merchant packs and dispatches the order, then clicks "Mark as Shipped."
7. Order status updates to **Shipped.**
8. Once delivered, merchant clicks "Mark as Delivered" — order status updates to **Delivered.**

### Customer Order Tracking
1. Customer receives an email notification at each status change (Processing → Shipped → Delivered).
2. Customer can log into their account or enter their phone number to view live order status at any time without contacting the merchant.

---

## Features

### Storefront
- Branded subdomain per merchant (`merchantname.shopnest.com.bd`)
- Mobile-optimized, single storefront theme with structured customization (hero image, titles, custom FAQs, social links, store description, address, subtitle)
- Dynamic collections (Featured Products, New Arrivals, Categories)
- "Buy Now" button that temporarily overrides the cart to take the customer straight to checkout with a single item
- Product catalog with name, description, price, images, and live stock count
- Out-of-stock products clearly marked and non-orderable
- Cart and structured checkout flow
- bKash/Nagad payment instructions with merchant's number displayed at checkout
- Transaction ID submission field at checkout
- Guest checkout via phone number OTP
- Registered customer accounts with order history and saved addresses

### Order Management (Merchant Dashboard)
- Real-time new order notifications via Telegram (opt-in) and in-dashboard Realtime
- Order list with status filters: Pending Payment, Processing, Shipped, Delivered, Cancelled
- One-click payment confirmation after verifying transaction ID
- Order status progression: Pending → Processing → Shipped → Delivered
- Customer details and delivery address per order
- Order search by customer name, phone number, or order ID

### Product Management (Merchant Dashboard)
- Add, edit, and delete products
- Product fields: name, description, price, stock count, images (quantity and size limit based on plan), category, promotion types (e.g., featured, new arrival, exclusive)
- Category CRUD management (Create, Read, Update, Delete) with limits based on plan
- No product variants in v1 (size/color treated as separate products)
- Stock count manually updated by merchant
- Low-stock threshold setting per product

### Inventory & Alerts
- Live stock count displayed on storefront
- Automatic out-of-stock prevention at checkout
- Manual stock adjustment from dashboard

### Notifications
- Email to customer: order confirmed, order shipped, order delivered
- In-dashboard realtime order list (new orders appear without page refresh via Supabase Realtime)
- **Telegram alerts to merchant: new order placed** (Starter, Growth, Pro plans — opt-in via Notifications settings tab)
- Pro plan: per-event channel routing (Telegram vs SMS) via `notification_preferences` table; SMS channel deferred to V3

### Discount Codes (Growth & Pro Plans)
- Merchant creates discount codes with fixed amount (৳) or percentage (%) off
- Advanced conditions: minimum purchase amount, specific applicable products
- Optional expiry date per code
- Optional usage limit per code
- Customer enters code at checkout and discount is applied to order total

### Storefront Editor & Settings
- Structured form to manage Hero Image, Subtitle, Description, Address, Social Links, and FAQs
- Manage City-based delivery charges (seller sets delivery charge for different cities)

### Subscription & Billing
- 7-day free trial with full feature access
- Starter Plan (৳499/month): 50 products, 200 orders/month, 5 categories, 2 images/product (1MB limit), no discount codes
- Growth Plan (৳999/month): 100 products, 500 orders/month, 15 categories, 5 images/product (2MB limit), discount codes
- Pro Plan (৳1499/month): Unlimited products, unlimited orders, unlimited categories, 5 images/product (2MB limit), discount codes
- Manual bKash/Nagad payment collection by ShopNest admin in v1
- Merchant subscription status managed via super admin panel

### Super Admin Panel
- View and manage all merchant accounts
- Manually activate, suspend, or cancel merchant subscriptions
- View subscription payment history per merchant
- Override trial expiry dates
- Monitor platform-wide order and merchant metrics

### Authentication
- Merchant: email + password or Google OAuth
- Registered customer: email + password or phone OTP + password
- Guest customer: phone OTP only (no account created)
- Super admin: email + password with 2FA

---

## In Scope (V1)

- Multi-tenant subdomain storefront per merchant
- Merchant onboarding and store setup flow
- Product catalog management (no variants)
- Cart and checkout with bKash/Nagad manual payment confirmation
- Guest checkout via phone OTP
- Registered customer accounts with order history
- Order management dashboard (mobile-first, English UI)
- Order status tracking for customers
- Live inventory stock count and out-of-stock prevention
- Realtime order list updates in merchant dashboard (Supabase Realtime)
- Email notifications to customers for order status changes
- **Telegram push notifications to merchants for new orders (asynchronous queue via Supabase Edge Function + pg_cron)**
- **Notification preferences table for Pro plan per-event channel routing (Telegram vs SMS)**
- Discount codes (Growth plan only)
- 7-day free trial + ৳499/৳999/৳1499 monthly subscription tiers
- Storefront Editor (structured form for Hero Image, FAQs, Socials)
- Category management & City-based delivery charges
- Advanced discount rules (min purchase, specific products)
- "Buy Now" flow (temporary cart override)
- Manual bKash/Nagad subscription collection by admin
- Super admin panel for merchant and subscription management
- Next.js subdomain routing via proxy
- Supabase Auth, Postgres DB, Storage, and Realtime
- Row-level security scoped by `merchant_id` on all tables
- Single responsive Next.js app (mobile-first, no separate mobile app)

---

## Out of Scope

### Deliberately V2
- [✅] Product variants (size, color, SKU matrix) — **implemented** (full attribute system, SKU auto-generation, dashboard editor, storefront variant selector)
- [❌] Compare-at-price — **not implemented**
- [✅] SKU — **implemented** (per-variant SKU with auto-generation)
- [❌] Product SEO — **not implemented** (no meta_title/meta_description on products)
- [⚠️] Cash on delivery (COD) payment option — **partially implemented** (feature flag exists in plan editor, but checkout only supports bkash/nagad — COD never surfaced in payment flow)
- [✅] Subscription plan maker and editor for superadmin — **implemented** (full CRUD at /admin/plans/)

### Deliberately V3
- [❌] Custom storefront themes — **not implemented** (single theme only)
- Abandoned cart recovery
- Custom storefront themes
- Analytics and sales reports dashboard
- Multiple staff accounts per merchant
- SMS notifications to merchants (new orders, low stock alerts) via Greenweb/BoomCast (Pro plan — Telegram is the v1 default for all plans)
- Pathao / Steadfast / Paperfly delivery integration

### Deliberately V4
- SSLCommerz or ShurjoPay card payment for subscription billing
- Real bKash/Nagad PGW integration for customer checkout
- Customer reviews and ratings
- Bengali language UI support
- Facebook pixel and conversion API intregration for merchants.

### Permanently Out of Scope
- Native mobile app (iOS or Android)
- Marketplace model (multiple merchants on one storefront)
- Social media integration or Facebook Messenger order capture
- Multi-currency support

---

## Success Criteria

### V1 is done when:

1. A merchant can sign up, set up their store, and add 10 products in under 15 minutes without any assistance.
2. A customer can visit a merchant's subdomain, place an order, submit a bKash transaction ID, and receive an email confirmation — end to end — in under 5 minutes.
3. A merchant sees a new order appear in their dashboard in real time within seconds of placement.
4. A merchant can confirm a payment and update an order status entirely from their mobile phone in under 3 taps.
5. Live stock count on the storefront accurately reflects merchant inventory and prevents checkout on out-of-stock items.
6. Subdomain routing correctly isolates each merchant's storefront and data — no merchant can see another merchant's orders, products, or customers.
7. The super admin can manually activate or suspend a merchant subscription in under 1 minute.
8. The platform handles 50 concurrent merchants each with active storefronts without performance degradation.
9. All pages are fully usable on a mid-range Android phone on a 4G connection with no layout breakage.
10. The 7-day trial, Starter plan limits (50 products, 200 orders), and Growth plan limits are correctly enforced at the application layer.
