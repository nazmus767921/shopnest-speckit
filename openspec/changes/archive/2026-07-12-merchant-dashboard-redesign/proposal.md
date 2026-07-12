## Why

The current merchant dashboard provides only basic KPIs (Total Sales, Active Products, Active Orders) and static reference information (storefront URL, onboarding checklist), lacking the actionable insights and real-time operational context that small-to-medium business owners need. This change introduces a robust hybrid dashboard modeled after industry standards to give merchants a quick pulse-check of their daily health and immediate visibility into actionable items like pending payment confirmations and low stock alerts.

## What Changes

- A new 3-layer hybrid layout: KPI cards at top, Actionable alerts in the middle, Trend chart at the bottom.
- 4 primary KPI cards: Today's Revenue, Today's Orders, Pending Orders, Low Stock Products.
- 2 secondary KPI cards: Total Revenue, Active Products.
- Delta indicators for revenue and orders comparing today vs. yesterday.
- A "Recent Orders" feed with status badges.
- Actionable alert widgets for "Orders Needing Attention", "Low Stock Products", and "Out of Stock Products".
- A Revenue over time area chart (Recharts) with date range selection (7d, 30d, 90d).
- A "Top 5 Selling Products" list ranked by revenue.
- Conditional rendering of the Onboarding Checklist (hides when setup is complete).
- Relocation of the Storefront URL to a compact sidebar/header element.

## Capabilities

### New Capabilities
- `merchant-dashboard-analytics`: Defines the new dashboard layout, data fetching strategies (RSC), and the Recharts implementation for revenue trends.
- `dashboard-action-alerts`: Defines the actionable widgets (Pending Verification, Low Stock, Out of Stock, Recent Orders) for the middle layer.

### Modified Capabilities
- None.

## Impact

- `app/(dashboard)/dashboard/page.tsx` will be completely overhauled.
- Several new database queries will be introduced (today's revenue, yesterday's comparison, top selling products, low stock aggregation).
- Recharts will be added to the project for rendering the revenue area chart.
- The onboarding checklist and storefront URL components will be updated/moved.
