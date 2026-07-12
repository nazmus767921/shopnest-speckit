## 1. Database Queries

- [x] 1.1 Implement query for today's revenue and yesterday's revenue (`getDashboardRevenueStats` in `db/queries/dashboard.ts`). Write failing tests first.
- [x] 1.2 Implement query for today's order count and yesterday's order count (`getDashboardOrderStats`). Write failing tests first.
- [x] 1.3 Implement query for pending payment confirmation count (`getPendingVerificationsCount`). Write failing tests first.
- [x] 1.4 Implement query for low stock products count and top 3 list (`getLowStockAlerts`). Write failing tests first.
- [x] 1.5 Implement query for out of stock products count and top 3 list (`getOutOfStockAlerts`). Write failing tests first.
- [x] 1.6 Implement query for recent orders feed (`getRecentOrdersFeed`). Write failing tests first.
- [x] 1.7 Implement query for revenue over time (7d/30d/90d) (`getRevenueTrendData`). Write failing tests first.
- [x] 1.8 Implement query for top 5 selling products by revenue (`getTopSellingProducts`). Write failing tests first.

## 2. Dependencies and UI Components

- [x] 2.1 Install Recharts dependency.
- [x] 2.2 Add or verify Shadcn UI Chart components are available in the project (`components/ui/chart.tsx`).

## 3. Dashboard UI Implementation

- [x] 3.1 Refactor `app/(dashboard)/dashboard/page.tsx` to remove old static cards and prepare the new 3-layer structure.
- [x] 3.2 Relocate the Storefront URL widget to a compact element (e.g., sidebar or header).
- [x] 3.3 Create `DashboardKPIs` component for the top layer, fetching data from the new queries and displaying deltas.
- [x] 3.4 Create `DashboardActionAlerts` component for the middle layer right column (Orders Needing Attention, Low Stock, Out of Stock).
- [x] 3.5 Create `RecentOrdersFeed` component for the middle layer left column.
- [x] 3.6 Create `"use client"` `RevenueChart` wrapper component using Recharts.
- [x] 3.7 Create `DashboardAnalytics` component for the bottom layer containing `RevenueChart` and `TopSellingProducts`.
- [x] 3.8 Update `DashboardChecklist` conditional rendering to hide entirely when all steps are completed.
- [x] 3.9 Integrate all components into `app/(dashboard)/dashboard/page.tsx` with appropriate `<Suspense>` boundaries.

## 4. Final Review

- [x] 4.1 Verify UI matches the `DESIGN.md` rules (colors, spacing, typography).
- [x] 4.2 Validate server-side data fetching and cache boundaries.
- [x] 4.3 Test the Recharts revenue trend with mock or real data.
