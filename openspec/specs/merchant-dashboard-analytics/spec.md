# Merchant Dashboard Analytics

## Purpose
TBD

## Requirements

### Requirement: Top-Level KPI Cards
The dashboard MUST display 4 primary KPI cards at the top: Today's Revenue, Today's Orders, Pending Orders, and Low Stock Products, followed by 2 secondary KPI cards below them: Total Revenue and Active Products. The revenue and order cards MUST include a percentage change delta compared to yesterday, with a visual indicator (green up-arrow or red down-arrow).

#### Scenario: Viewing KPI Cards
- **WHEN** the merchant views the dashboard
- **THEN** they see 6 KPI cards with their respective metrics and delta comparisons for today vs. yesterday.

### Requirement: Revenue Trend Chart
The dashboard MUST display an area chart visualizing revenue over time in the bottom left column. The chart MUST default to a 7-day view with daily granularity and MUST include a dropdown to select 30-day or 90-day ranges. The chart MUST be rendered using Recharts and receive aggregated data fetched on the server.

#### Scenario: Viewing Revenue Trends
- **WHEN** the merchant views the bottom section of the dashboard
- **THEN** they see a 7-day revenue trend area chart that accurately reflects the sum of confirmed orders per day.

### Requirement: Top Selling Products
The dashboard MUST display a ranked list of the top 5 selling products by total revenue in the bottom right column. Each item MUST display its rank, product name, thumbnail image, and total revenue earned.

#### Scenario: Viewing Top Sellers
- **WHEN** the merchant views the bottom section of the dashboard
- **THEN** they see the top 5 products ranked by revenue, allowing them to identify their best performers.

### Requirement: Conditional Onboarding Checklist
The existing Onboarding Checklist MUST be conditionally rendered. It MUST only be visible if the merchant has incomplete setup steps. Once all setup steps are complete, the checklist MUST be hidden to provide a cleaner layout for established merchants.

#### Scenario: Established Merchant Views Dashboard
- **WHEN** a merchant who has completed all setup steps views the dashboard
- **THEN** the onboarding checklist is completely hidden.

### Requirement: Relocated Storefront URL Widget
The Storefront URL widget (displaying the `.shopnest.com.bd` subdomain and subscription badge) MUST be removed from the main dashboard body and relocated to a compact element in the sidebar or header.

#### Scenario: Finding Storefront URL
- **WHEN** the merchant looks for their storefront link
- **THEN** they find it in a compact location outside of the primary dashboard content area.
