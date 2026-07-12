# Merchant Dashboard — KPI, Widgets & Metrics Design

> Design specification for ShopNest's merchant dashboard, derived from industry research (Shopify, WooCommerce, BigCommerce, Ecwid) and collaborative design interview.

## Design Philosophy

**Hybrid Dashboard:** Quick KPI cards at top → Actionable alerts in the middle → Trend chart at the bottom.

The dashboard serves two questions every morning:
1. **"How is today going?"** → KPI cards with delta indicators
2. **"What needs my attention?"** → Actionable alerts (orders, stock)

---

## Layout Architecture

```
┌────────────────────────────────────────────────────────────┐
│  HEADER: Date + "Welcome back, {name}" + [Add Product] CTA│
├────────────────────────────────────────────────────────────┤
│  ONBOARDING CHECKLIST (conditional — hidden when complete) │
├──────────┬──────────┬──────────┬──────────────────────────┤
│ Today's  │ Today's  │ Pending  │ Low Stock               │
│ Revenue  │ Orders   │ Orders   │ Products                │
│ ↑12% vs  │ ↑5% vs   │ ⚠ 3     │ ⚠ 7 items               │
│ yesterday│ yesterday│ need attn│                          │
├──────────┴──────────┴──────────┴──────────────────────────┤
│  SECONDARY ROW                                            │
│  ┌─────────────────────┐  ┌─────────────────────────┐     │
│  │ Total Revenue (all) │  │ Active Products (x/50)  │     │
│  └─────────────────────┘  └─────────────────────────┘     │
├───────────────────────────┬───────────────────────────────┤
│  RECENT ORDERS (7/12)     │  ALERTS (5/12)                │
│  Last 5-10 orders with    │  ┌─────────────────────────┐  │
│  status badges, clickable │  │ Orders Needing Attention│  │
│  to order detail          │  │ (pending_payment with   │  │
│                           │  │ payment confirmation)   │  │
│                           │  ├─────────────────────────┤  │
│                           │  │ Low Stock Products      │  │
│                           │  │ (below threshold)       │  │
│                           │  ├─────────────────────────┤  │
│                           │  │ Out of Stock Products   │  │
│                           │  │ (stock=0, published)    │  │
│                           │  └─────────────────────────┘  │
├───────────────────────────┬───────────────────────────────┤
│  REVENUE CHART (7/12)     │  TOP SELLING PRODUCTS (5/12)  │
│  Area/line chart          │  Top 5 products ranked by     │
│  Default: Last 7 days     │  revenue (৳ earned)           │
│  Dropdown: 30d, 90d       │                               │
│  Daily granularity        │                               │
└───────────────────────────┴───────────────────────────────┘
```

---

## Layer 1: Primary KPI Cards (Top Row — 4 cards)

| Card | Metric | Source | Delta |
|------|--------|--------|-------|
| **Today's Revenue** | Sum of `orders.totalPaisa` for today where status ∈ {processing, shipped, delivered} | `orders` table | ↑/↓ % vs yesterday, green/red arrow |
| **Today's Orders** | Count of orders created today (excluding abandoned carts) | `orders` table | ↑/↓ % vs yesterday, green/red arrow |
| **Pending Orders** | Count of `pending_payment` orders that have a `payment_confirmation` record | `orders` + `payment_confirmations` | No delta — just a count with ⚠ warning color if > 0 |
| **Low Stock Products** | Count of products where `stock_count <= low_stock_threshold` and `deleted_at IS NULL` | `products` table | No delta — count with ⚠ warning color if > 0 |

### Delta Indicator Design
- **Up:** Green text + `↑` arrow + percentage (e.g., `↑ 12% vs yesterday`)
- **Down:** Red text + `↓` arrow + percentage (e.g., `↓ 8% vs yesterday`)
- **Flat:** Muted text + `→` or `0%` (e.g., `→ Same as yesterday`)
- **No data:** Muted text (e.g., `No data for yesterday`)

---

## Layer 1b: Secondary KPI Cards (Below primary — 2 cards)

| Card | Metric | Source | Notes |
|------|--------|--------|-------|
| **Total Revenue** | Sum of `orders.totalPaisa` all-time for status ∈ {processing, shipped, delivered} | `orders` table | Existing metric, keep as-is |
| **Active Products** | Count of non-deleted products | `products` table | Keep existing progress bar for Starter plan limit |

---

## Layer 2: Actionable Middle Section (Two-Column, 7/12 + 5/12)

### Left Column (7/12): Recent Orders Feed

- **Data:** Last 5–10 orders for this merchant, ordered by `created_at DESC`
- **Display:** Compact list/table with:
  - Order ID (truncated or short format)
  - Customer name (`delivery_name`)
  - Total (৳ formatted from `totalPaisa`)
  - Status badge (color-coded pill: pending_payment → amber, processing → blue, shipped → indigo, delivered → green, cancelled → red)
  - Time ago (e.g., "2 hours ago")
- **Interaction:** Each row is clickable → navigates to `/dashboard/orders/{id}`
- **Empty state:** "No orders yet. Share your storefront link to start receiving orders!"

### Right Column (5/12): Stacked Alert Cards

#### 1. Orders Needing Attention
- **Data:** Count of orders WHERE `status = 'pending_payment'` AND EXISTS a `payment_confirmation` record for that order
- **Display:** Count badge with warning styling, brief description, "View" link → `/dashboard/orders?status=pending_payment`
- **Rationale:** This is ShopNest-specific — customers submit bKash/Nagad transaction IDs that merchants must manually verify

#### 2. Low Stock Products
- **Data:** Products WHERE `stock_count > 0 AND stock_count <= low_stock_threshold AND deleted_at IS NULL`
- **Display:** Count + list of top 3 product names with current stock, "View All" link → `/dashboard/products?filter=low_stock`

#### 3. Out of Stock Products
- **Data:** Products WHERE `stock_count = 0 AND is_published = true AND deleted_at IS NULL`
- **Display:** Count + list of top 3 product names, "View All" link → `/dashboard/products?filter=out_of_stock`
- **Severity:** Red/destructive styling — these are published products customers can see but can't buy

---

## Layer 3: Analytics Section (Two-Column, 7/12 + 5/12)

### Left Column (7/12): Revenue Over Time Chart

- **Chart type:** Area chart (filled line) — clean, modern, easy to read
- **Library:** Recharts via Shadcn UI `Chart` component
- **Default range:** Last 7 days (daily granularity)
- **Range selector:** Dropdown with options: `7 days`, `30 days`, `90 days`
- **Data source:** Aggregate `orders.totalPaisa` by day WHERE status ∈ {processing, shipped, delivered}
- **Y-axis:** Revenue in ৳ (formatted)
- **X-axis:** Date labels (e.g., "Jul 5", "Jul 6")
- **Tooltip:** Show exact ৳ value + order count on hover
- **Empty state:** Show flat line at 0 with message "Revenue data will appear as orders come in"

> [!IMPORTANT]
> **RSC Boundary:** The chart wrapper is a `"use client"` component. Data aggregation happens server-side. Pre-computed `{ date: string, revenue: number }[]` array is passed as props.

### Right Column (5/12): Top Selling Products

- **Data:** Top 5 products ranked by total revenue (sum of `order_items.unit_price_paisa * order_items.quantity`)
- **Time range:** All-time (or match the chart's selected range — open question)
- **Display:** Ranked list with:
  - Rank number (1–5)
  - Product name (truncated if long)
  - Product thumbnail (from `product_images`, first image)
  - Total revenue (৳ formatted)
- **Interaction:** Each item clickable → `/dashboard/products/{id}`
- **Empty state:** "No sales data yet."

---

## Removed / Relocated Elements

| Element | Current Location | New Location | Rationale |
|---------|-----------------|--------------|-----------|
| Storefront URL panel | Dashboard right column | Sidebar or header compact element | Static reference info, not dashboard-worthy |
| Onboarding Checklist | Dashboard left column (always shown) | Dashboard (conditional — hidden when all steps complete) | Clean dashboard for established merchants |

---

## Conditional Behavior

### New Merchant (setup incomplete)
```
Header → Onboarding Checklist → KPI Cards → Middle Section → Chart Section
```

### Established Merchant (setup complete)
```
Header → KPI Cards → Middle Section → Chart Section
```

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Charting library | Recharts | Shadcn UI Chart components built on it; React-native; SVG-based |
| Data fetching | Server-side only (RSC) | Simplest, most performant for V1; merchants check periodically, not real-time |
| RSC boundary | Thin `"use client"` chart wrapper only | Aligns with "RSC by Default" rule; all DB queries stay server-side |
| Delta comparison | vs Yesterday | Most intuitive for SMB merchants; Shopify default |
| Delta styling | Green ↑ / Red ↓ arrows with % | Universal financial dashboard visual language |

---

## Data Queries Needed

### New queries to implement:
1. **Today's revenue** — `SUM(totalPaisa)` from orders WHERE `merchantId` AND `createdAt >= today start` AND status ∈ confirmed statuses
2. **Yesterday's revenue** — Same but for yesterday's date range
3. **Today's order count** — `COUNT(*)` from orders WHERE same filters
4. **Yesterday's order count** — Same but yesterday
5. **Pending verification count** — `COUNT(*)` from orders WHERE `status = 'pending_payment'` AND EXISTS payment_confirmation
6. **Low stock products** — `SELECT` from products WHERE `stock_count > 0 AND stock_count <= low_stock_threshold AND deleted_at IS NULL`
7. **Out of stock products** — `SELECT` from products WHERE `stock_count = 0 AND is_published = true AND deleted_at IS NULL`
8. **Recent orders** — `SELECT` top 10 orders ORDER BY `created_at DESC` with status
9. **Revenue by day** — `SELECT date_trunc('day', created_at), SUM(totalPaisa)` GROUP BY day for last N days
10. **Top selling products** — `SELECT product_id, SUM(unit_price_paisa * quantity)` FROM order_items GROUP BY product_id ORDER BY revenue DESC LIMIT 5

### Existing queries to keep:
- Total sales (all-time)
- Active products count

---

## Industry Benchmarks Referenced

| Platform | Top KPI Cards | Primary Chart | Key Differentiator |
|----------|--------------|---------------|-------------------|
| **Shopify** | Today's Sales, Sessions, Returning Customers, Orders | Sales over time (line) | Date range picker, channel attribution |
| **WooCommerce** | Net Sales, Orders, Avg Order Value | Revenue line chart | Custom date ranges, product leaderboard |
| **BigCommerce** | Revenue, Orders, AOV, Conversion Rate | Revenue trend | Built-in channel analytics |
| **Ecwid** | Visitors, Revenue, Orders | Sales overview | Simplified for SMBs |
| **ShopNest (proposed)** | Today's Revenue, Today's Orders, Pending, Low Stock | Revenue area chart | Payment verification alerts (unique to bKash/Nagad flow) |
