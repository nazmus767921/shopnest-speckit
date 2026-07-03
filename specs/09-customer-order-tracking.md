# Spec: 9. Customer Order Tracking & Email Receipts

## Goal
Build the customer-facing order tracking portal at `(storefront)/orders` to allow customers to view their order status and history. Implement Supabase Edge Functions with Resend to automatically dispatch transactional emails (order confirmed, shipped, delivered) based on database webhooks.

## Design
- **Order Tracking Portal (`(storefront)/orders`)**:
  - **Unauthenticated State**: A simple form prompting for Phone Number + OTP to look up order history for guest users, or a login link for registered users.
  - **Authenticated State (Guest/Registered)**: A list of past and current orders.
  - **Order Detail Page (`(storefront)/orders/[id]`)**: Displays a visual timeline of the order status (Pending Payment &rarr; Processing &rarr; Shipped &rarr; Delivered), delivery address, order items, and total amount.
- **Email Receipts**:
  - HTML email templates for three events: Order Confirmed, Order Shipped, and Order Delivered. 
  - Emails must include order summary, status, and a link back to the order tracking page.

## Implementation

### 1. Order Tracking UI
- **`app/(storefront)/orders/page.tsx`**: 
  - If no session, show phone OTP form to create an anonymous session or login as customer.
  - If session exists, fetch and display orders using a TanStack Query hook (`useCustomerOrders`).
- **`app/(storefront)/orders/[id]/page.tsx`**:
  - Fetch specific order details including `order_items` and `payment_confirmations`.
  - Render a visual status tracker using `components/ui` components for a timeline.

### 2. Session Promotion (Guest to Registered)
- Add a "Create Account" prompt on the order tracking or checkout success page for guest users (who checked out with just Phone OTP).
- Call Better Auth API to promote the anonymous session to a registered customer account.

### 3. Email Infrastructure & Logging
- **`db/schema.ts`**: Ensure the `email_logs` table exists (`id`, `recipient_email`, `template`, `order_id`, `status`, `sent_at`).
- **`lib/email.ts`**: Implement a wrapper around the `resend` SDK. It must catch any errors during sending and log the attempt (success or failure) to the `email_logs` table. It must never throw an error that crashes the calling function.

### 4. Supabase Edge Functions
- **`supabase/functions/on-payment-confirmed/index.ts`**:
  - Trigger: Webhook on `payment_confirmations` table `UPDATE` where `confirmed_at` becomes non-null.
  - Action: Fetch customer email and order details, format the "Order Confirmed" template, and send via `lib/email.ts`.
- **`supabase/functions/on-order-status-changed/index.ts`**:
  - Trigger: Webhook on `orders` table `UPDATE` where `status` changes to `shipped` or `delivered`.
  - Action: Check new status, format the appropriate template ("Order Shipped" or "Order Delivered"), and send via `lib/email.ts`.

## Dependencies
- `resend` (for sending transactional emails)
- `@supabase/supabase-js` (within Edge Functions context)

## Verification Checklist
- [x] Guest customer can view their order status using their phone number and OTP.
- [x] Registered customer can log in and view their complete order history.
- [x] Order detail page accurately reflects the current status in a visual timeline.
- [x] Guest session can be successfully promoted to a registered customer account.
- [x] Updating a payment confirmation in the dashboard triggers the `on-payment-confirmed` edge function.
- [x] Updating an order status to 'shipped' or 'delivered' triggers the `on-order-status-changed` edge function.
- [x] Emails are successfully received by the customer with accurate order details.
- [x] All email dispatch attempts (successful and failed) are recorded in the `email_logs` table.
- [x] Email dispatch failures do not block or rollback the database update.

