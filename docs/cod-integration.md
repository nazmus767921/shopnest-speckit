# Cash on Delivery (COD) Payment Integration

This document outlines the Cash on Delivery (COD) payment system workflow in ShopNest, including settings configuration, checkout payment options, dashboard order management, and stock restoration logic.

---

## 1. Feature Overview

The Cash on Delivery (COD) payment option allows storefront customers to place orders and complete payment upon delivery. The system supports two distinct COD checkout flows depending on the merchant's operational requirements:

1. **Standard Cash on Delivery**: The customer pays the full order balance (products + shipping) in cash to the delivery agent at the doorstep.
2. **Upfront Delivery Charge Payment (COD)**: The customer must pay the delivery charge in advance using mobile wallets (bKash/Nagad) and submit the transaction ID (TxID) to place the order. The remaining product balance is collected as cash on delivery at the doorstep.

---

## 2. Plan-Gated Settings Configuration

COD configuration is available in the merchant's settings dashboard. This feature is plan-gated:
* **Growth/Enterprise Plan**: Full configuration access to enable COD and upfront charges.
* **Starter/Free Plan**: Feature locked. Toggles are disabled and show an upgrade prompt.

### Merchant Configuration Fields
* `cod_enabled` (Boolean): Enables/disables the COD payment method on the storefront checkout page.
* `pay_delivery_charge_first` (Boolean): Determines whether customers must pay delivery charges upfront.
* `bkash_wallet_number` (String): The merchant's personal bKash wallet number used to receive upfront delivery payments.
* `nagad_wallet_number` (String): The merchant's personal Nagad wallet number used to receive upfront delivery payments.

---

## 3. Storefront Checkout Workflows

When the customer proceeds to checkout, the payment step dynamically renders based on the merchant's settings:

### Flow A: Standard COD (Pay Full Amount on Delivery)
* **Pre-conditions**: `cod_enabled === true` and `pay_delivery_charge_first === false`.
* **Checkout UI**:
  -Surfaces a "COD" payment method tab alongside bKash and Nagad options.
  -Displays a Cash on Delivery information card advising the customer to pay the full amount on delivery.
  -Hides the Transaction ID (TxID) field.
* **Backend Processing**:
  -Order is created directly in the `processing` status.
  -A transaction confirmation record is created with payment method `"cod"` and transaction ID `"COD"`.

### Flow B: Upfront Delivery Charge COD
* **Pre-conditions**: `cod_enabled === true` and `pay_delivery_charge_first === true`.
* **Checkout UI**:
  -Surfaces the "COD" payment method tab.
  -Allows the customer to choose between bKash and Nagad to pay the advance delivery charge.
  -Displays the merchant's corresponding bKash or Nagad wallet number.
  -Shows financial breakdown (Upfront Payment vs. Cash on Delivery product balance).
  -Requires the customer to input the transaction ID (TxID) before submission.
* **Backend Processing**:
  -Order is created in the `pending_payment` status.
  -A transaction confirmation record is created with payment method `"cod"` and the submitted transaction ID.

---

## 4. Dashboard Order & Inventory Management

Merchants manage COD orders in their dashboard using status transition actions:

### Confirming Upfront Payments
* For orders in the `pending_payment` status (Upfront COD), a "Confirm Payment" button is visible.
* Clicking it updates the order status to `processing` after the merchant verifies the transaction ID.

### Order Completion (Delivered)
* When a COD order is updated to `delivered`, the system automatically marks the payment as completed (sets `confirmedAt` on the payment confirmation record).

### Order Returns & Doorstep Rejections
* If a customer rejects the delivery or returns an order, the merchant marks the status as `returned`.
* When an order's status transitions to `returned` from a non-returned/non-cancelled state:
  -Stock counts for all items in the order are automatically restored to the inventory (handles both simple products and variant-level stocks).
  -The order is closed and no further status modifications can be made.
