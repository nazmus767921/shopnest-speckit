# Spec: Dashboard Order Management

## Goal
Build the merchant dashboard views and server actions to list, search, and manage orders, enabling merchants to review payment transaction IDs, confirm payments, and progress order statuses from "Pending" through to "Delivered".

## Design
*   **Mobile-First Layout:** The primary interface for merchants will likely be their mobile phones. The order list should use a card-based layout on smaller screens and a data table on larger screens.
*   **Order List View (`/orders`):**
    *   **Filters & Search:** Sticky top bar with a search input (by Order ID, Customer Name, or Phone) and a scrollable row of status filter chips (All, Pending Payment, Processing, Shipped, Delivered, Cancelled).
    *   **Data Display:** Each row/card should prominently display the Order ID, time elapsed since order (e.g., "2 hours ago"), Customer Name, Total Amount, and a color-coded Status Badge.
*   **Order Detail View (`/orders/[id]`):**
    *   **Header:** Order ID, Date, and current Status Badge.
    *   **Action Bar (Sticky Bottom/Top):** Primary button changes based on status (e.g., "Confirm Payment" when Pending, "Mark as Shipped" when Processing).
    *   **Customer & Delivery Section:** Customer name, phone (tap to call), and full delivery address.
    *   **Payment Section:** Payment method (bKash/Nagad), submitted Transaction ID (copyable), and payment status.
    *   **Order Items Section:** List of products ordered, quantity, unit price, and total calculation.
*   **Status Badges:** Use distinct colors for statuses (e.g., Yellow/Orange for Pending, Blue for Processing, Purple for Shipped, Green for Delivered, Red/Gray for Cancelled).

## Implementation

### 1. Database Queries (`db/queries/orders.ts`)
*   `getOrders({ merchantId, status, search, page, limit })`: Fetch paginated orders. Must include the customer name/phone and the total amount. Secure with `merchant_id`.
*   `getOrderDetails({ merchantId, orderId })`: Fetch a single order, joining `order_items`, `products` (for name/image), `customers`, and `payment_confirmations`. Secure with `merchant_id`.

### 2. UI Components & Pages (`app/(dashboard)/orders/`)
*   **`page.tsx` (List View):** Server Component. Fetches initial data. Includes Client Components for the search input (debounced) and status filter tabs.
*   **`[id]/page.tsx` (Detail View):** Server Component. Fetches full order details. Displays the different sections (Customer, Payment, Items).
*   **`OrderActions` (Client Component):** Renders the primary action buttons (Confirm, Ship, Deliver) and handles the pending state (loading spinner) while calling the server actions.
*   **`StatusBadge` (Shared UI):** A small component that takes a status string and renders the appropriate color badge.

### 3. Server Actions (`app/(dashboard)/orders/actions.ts`)
*   `confirmPaymentAction(orderId)`:
    *   Validates session (must be merchant).
    *   Verifies the order belongs to the `merchant_id`.
    *   Updates `payment_confirmations.confirmed_at` and `confirmed_by`.
    *   Updates `orders.status` to `processing`.
    *   Revalidates the `/orders` and `/orders/[id]` paths.
*   `updateOrderStatusAction(orderId, newStatus)`:
    *   Validates session (must be merchant).
    *   Verifies the order belongs to the `merchant_id`.
    *   Validates valid state transitions (e.g., can't go from Pending straight to Delivered without confirming payment).
    *   Updates `orders.status` to `newStatus` (e.g., `shipped`, `delivered`, `cancelled`).
    *   Revalidates the `/orders` and `/orders/[id]` paths.

### 4. Realtime Integration (Optional v1 enhancement)
*   Implement a hook (`useRealtimeOrders`) in the list view that subscribes to Supabase Realtime for the `orders` table (filtered by `merchant_id`). When a new order arrives (INSERT), it triggers a TanStack Query invalidation or a Next.js router refresh to show the new order immediately.

## Dependencies
*   No new dependencies required. We will use the existing `lucide-react` for icons (e.g., copy, phone, truck, check-circle) and `date-fns` (if already installed) for time formatting (e.g., "2 hours ago").

## Verification Checklist
- [ ] List view displays all orders belonging ONLY to the logged-in merchant.
- [ ] List view can be filtered by clicking status tabs.
- [ ] List view can be searched by Order ID, customer name, or phone number.
- [ ] Detail view shows correct customer info, address, items, and total.
- [ ] Detail view prominently displays the bKash/Nagad TxID submitted by the customer.
- [ ] Merchant can click "Confirm Payment", which updates the status to "Processing".
- [ ] Merchant can transition status to "Shipped" and then "Delivered".
- [ ] All server actions strictly enforce the `merchant_id` boundary (a merchant cannot modify another merchant's order).
- [ ] UI is responsive and usable on a mobile device without horizontal scrolling.
