# Quickstart Validation Guide: Cash on Delivery (COD) Checkout Integration

This guide provides step-by-step scenarios to manually or programmatically verify that the Cash on Delivery (COD) feature behaves correctly.

## Prerequisites
1. Local database running with migrations applied.
2. Seed data loaded (specifically subscription plans with the `cod` feature flag configured).
3. Local development server running:
   ```bash
   pnpm dev
   ```

---

## Scenario 1: Subscription Plan Enforcement
**Goal**: Verify that merchants on a plan without the COD feature cannot enable it.

1. Log in to a merchant dashboard where the merchant's plan is "Starter" (assuming Starter plan has `cod: false`).
2. Navigate to **Store Settings** > **Payments**.
3. **Verify**:
   - The Cash on Delivery toggle should be disabled, showing an upgrade message (e.g., "Upgrade to Growth or Pro to enable Cash on Delivery").
4. Try to make an API action request to enable COD for this merchant using a tool like Postman/cURL, or check via server action directly:
   - **Expect**: The server action `updateStoreSettingsAction` must return `{ success: false, error: "..." }` and reject the configuration change.

---

## Scenario 2: Standard Cash on Delivery Order Flow
**Goal**: Verify that a merchant can enable standard COD, and a customer can checkout without entering a transaction ID.

1. Log in as a merchant on a plan that supports COD (e.g. Growth).
2. Go to **Store Settings** > **Payments**, toggle **Cash on Delivery** to **Enabled** (leaving "Pay Delivery Charge First" disabled), and click **Save**.
3. As a customer, navigate to the storefront checkout:
   - Fill in shipping address details and proceed.
   - On the payment step, select **Cash on Delivery** from the payment options.
   - **Verify**: The transaction ID input and bKash/Nagad instructions are hidden. A delivery note ("Pay in cash when your order arrives") is displayed.
   - Click **Submit Order**.
4. Log back in as the merchant and go to **Orders**:
   - **Verify**: The new order has a distinct **COD** badge in the list.
   - Open the order details page.
   - **Verify**: The order status is already **Processing** (bypassing the `pending_payment` stage). No "Confirm Payment" button is displayed.
   - Mark the order as **Delivered**.
   - **Verify**: The order status becomes **Delivered** and the payment is marked as fully paid.

---

## Scenario 3: COD with "Pay Delivery Charge First" Flow
**Goal**: Verify checkout and order fulfillment when upfront delivery charge is required.

1. In the merchant settings, toggle **Cash on Delivery** to **Enabled** and **Pay Delivery Charge First** to **Enabled**. Save settings.
2. Go to storefront checkout as a customer:
   - Fill in shipping details and proceed.
   - On the payment step, select **Cash on Delivery**.
   - **Verify**: The page displays instructions to send the delivery charge (e.g. ৳60 or ৳120) to the merchant's bKash/Nagad number, and requires a Transaction ID.
   - Enter a mock transaction ID (e.g., `TRX12345678`) and click **Submit Order**.
3. Log in as the merchant and view **Orders**:
   - **Verify**: The order has a **COD** badge and its status is **Pending Payment**.
   - Open the order details.
   - **Verify**: The payment details section shows the bKash/Nagad transaction ID submitted for the delivery charge. A **Confirm Payment** button is visible.
   - Click **Confirm Payment**.
   - **Verify**: The order status transitions to **Processing**.

---

## Scenario 4: Doorstep Rejection & Stock Restoration
**Goal**: Verify that rejected/returned orders automatically restore inventory counts.

1. Identify a product with a current stock count of `10`.
2. Place a COD order for `2` units of this product (reducing stock count to `8`).
3. Log in as the merchant, open the order, and change the order status to **Returned** (representing a doorstep rejection).
4: **Verify**:
   - The order status updates successfully to **Returned**.
   - Check the product's stock count. It must automatically return to `10` in the database.
5. As the customer, view the order details page:
   - **Verify**: The page displays a dedicated "Returned" banner at the top, and the standard step-by-step progress timeline tracker is hidden.
