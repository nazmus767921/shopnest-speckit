## Context

ShopNest merchants currently have a very basic dashboard with three metric cards (Total Sales, Active Products, Active Orders) and static widgets. As our merchants grow, they need real-time, actionable insights (like pending payments to verify, low stock) and performance trends (daily revenue) to effectively manage their business. The new hybrid dashboard pattern will deliver these insights without overwhelming them.

## Goals / Non-Goals

**Goals:**
- Provide daily pulse-check metrics (revenue, orders) with yesterday's comparisons.
- Centralize operational alerts (orders needing payment confirmation, low stock products).
- Visualize revenue trends using Recharts.
- Hide the onboarding checklist for established merchants to free up space.

**Non-Goals:**
- Introducing complex BI or custom reporting features.
- Modifying the storefront URL routing logic (only relocating the display widget).
- Implementing client-side real-time polling (data will remain server-fetched on page load).

## Decisions

- **Data Fetching Strategy**: We will use Server-Side React Components (RSC) exclusively for data fetching on the dashboard. No client-side polling or TanStack Query.
  - *Rationale*: Most merchants only check the dashboard periodically. RSC minimizes client bundle size and leverages Next.js 16 caching effectively.
- **Client Boundary for Charts**: The Recharts wrapper component will be the only `"use client"` leaf node.
  - *Rationale*: Recharts requires DOM APIs. We will fetch and aggregate the data on the server and pass an array of `{ date, revenue }` objects to the chart.
- **Database Aggregations**: We will introduce dedicated queries in `db/queries` to calculate today vs. yesterday deltas and top-selling products.
  - *Rationale*: Performing aggregation in Postgres is significantly faster than fetching raw rows and calculating in JS.
- **Delta Indicator Styling**: We will use universally understood green up-arrows and red down-arrows for revenue and order deltas.
  - *Rationale*: Enhances glanceability and adheres to industry-standard financial UI patterns.

## Risks / Trade-offs

- **Risk: Slow page load due to complex aggregations** → **Mitigation**: We will wrap the dashboard content in a `<Suspense>` boundary (which it already has) and optimize the SQL queries with appropriate indexes on `created_at` and `status` in the `orders` table.
- **Risk: Recharts client bundle size** → **Mitigation**: Lazy load the chart component using `next/dynamic` if it significantly impacts the initial JS payload, although standard importing is usually fine for a dashboard route.

## Migration Plan

- Deploy the new dashboard layout and queries. No database schema migrations are necessary, only new application-level queries.

## Open Questions

- Should we eventually allow merchants to select custom date ranges for the revenue chart, or stick to the fixed 7d/30d/90d dropdown?
