# Feature Specification: Cash on Delivery (COD) Checkout Integration

**Feature Branch**: `021-cod-checkout`

**Created**: 2026-07-04

**Status**: Draft

**Input**: User description: "Complete the integration of the Cash on Delivery (COD) payment method so that customers can select it during the checkout process. COD must be explicitly surfaced and fully functional within the customer payment flow."

## Clarifications

### Session 2026-07-04

- **Q: When a merchant enables the "Pay Delivery Charge First" option for COD, how should the customer submit the advance delivery charge payment during storefront checkout?**
  - **A:** Customer selects bKash/Nagad for the delivery charge and submits a Transaction ID. The remaining product balance is marked as COD.
- **Q: What should the initial status of the order be when a customer checks out using COD with the "Pay Delivery Charge First" requirement?**
  - **A:** Starts as `pending_payment`. Once the merchant confirms the delivery charge payment, the status transitions to `processing`.
- **Q: Since COD orders have a high risk of being rejected at the customer's doorstep (which directly incurs delivery costs for the merchant), how should we track order rejections/returns?**
  - **A:** Introduce a `returned` status to separate doorstep rejections/returns from regular cancellations.
- **Q: Where should the merchant configure the "Pay Delivery Charge First" option?**
  - **A:** Under the Payments tab, dynamically shown as a sub-option of the Cash on Delivery toggle.
- **Q: When a COD order (whether paying delivery charge first or full cash on delivery) is marked as `delivered` by the merchant, how should the payment state be finalized?**
  - **A:** Automatically mark the order as fully paid and record the delivery status, assuming courier cash collection was successful.
- **Q: How is the delivery charge amount determined for the upfront payment storefront display?**
  - **A:** The storefront checkout calculates it dynamically using the store's current shipping rate configuration (e.g. city-inside/outside shipping rules). This dynamic amount is displayed to the customer as the required advance payment.
- **Q: Where are the merchant's bKash and Nagad numbers configured for the storefront checkout instructions?**
  - **A:** The merchant configures their wallet numbers (`bkash_wallet_number` and `nagad_wallet_number`) under Store Settings > Payments. They are conditionally shown when "Pay Delivery Charge First" is enabled.
- **Q: How does the stock reservation work for orders requiring upfront delivery charge?**
  - **A:** Stock is decremented immediately when the order is created in the database. The merchant has the authority to cancel the order if the payment verification fails (e.g., transaction ID is invalid or not received), which immediately restores the stock.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enabling Cash on Delivery & Advance Payment Options (Priority: P1)

As a merchant whose subscription plan supports Cash on Delivery,
I want to be able to enable or disable Cash on Delivery, and choose whether to require upfront payment of the delivery charge,
So that I can control my checkout options and mitigate the financial risk of doorstep returns.

**Why this priority**: Core prerequisite for the feature. If the merchant cannot configure these toggles, customers cannot checkout using these options.

**Independent Test**: The merchant logs into the dashboard, navigates to Store Settings > Payments. They see the Cash on Delivery toggle. Toggling it "Enabled" reveals the "Pay Delivery Charge First" sub-toggle. Toggling both options and saving persists the state in the database.

**Acceptance Scenarios**:

1. **Given** a merchant is logged in and their subscription plan supports Cash on Delivery, **When** they view Store Settings > Payments, **Then** they see a Cash on Delivery toggle.
2. **Given** the merchant toggles Cash on Delivery to "Enabled", **When** they view the settings, **Then** a sub-toggle "Pay Delivery Charge First" is displayed below it.
3. **Given** the merchant enables "Pay Delivery Charge First" and saves, **When** the settings page is reloaded, **Then** both Cash on Delivery and the advance delivery charge rule are saved and active.
4. **Given** a merchant's subscription plan does NOT support Cash on Delivery, **When** they view Store Settings, **Then** the Cash on Delivery toggle is disabled.

---

### User Story 2 - Checking Out with Cash on Delivery (Priority: P1)

As a customer buying from a store with Cash on Delivery enabled,
I want to select Cash on Delivery as my payment method during checkout and understand whether I need to pay the delivery charge upfront,
So that I can complete my order.

**Why this priority**: This is the primary customer-facing capability that directly increases checkout conversion while enforcing the merchant's payment requirements.

**Independent Test**: A customer proceeds to checkout:
- **Case 1 (Standard COD)**: Customer selects Cash on Delivery. All transaction ID inputs are hidden. They see a note to pay the full amount upon delivery. They submit the order, and it goes through.
- **Case 2 (Pay Delivery Charge First)**: Customer selects Cash on Delivery. They see instructions to pay the delivery charge (e.g. ৳120) via bKash/Nagad. They enter their transaction ID. They submit the order, and it goes through.

**Acceptance Scenarios**:

1. **Given** a customer is on the checkout payment step and the merchant has enabled standard COD, **When** they select Cash on Delivery, **Then** the transaction ID inputs are hidden, they see a delivery note ("Pay in cash when your order arrives"), and the order is placed with status `processing`.
2. **Given** the merchant has enabled COD with "Pay Delivery Charge First", **When** the customer selects Cash on Delivery, **Then** they see instructions displaying the merchant's bKash/Nagad number, a request to pay the delivery charge (e.g., ৳60 or ৳120) upfront, and a required Transaction ID input field.
3. **Given** the merchant requires advance delivery charge, **When** the customer submits a valid transaction ID and clicks "Submit Order", **Then** the order is successfully placed and created with status `pending_payment`.

---

### User Story 3 - Managing COD and Returned Orders (Priority: P2)

As a merchant,
I want to easily identify COD orders, verify upfront delivery payments, and handle returns,
So that I can fulfill orders efficiently and track inventory accurately.

**Why this priority**: Essential merchant dashboard workflow for order fulfillment and stock control.

**Independent Test**: The merchant logs into the dashboard, views the order list, confirms payment for a delivery-charge-pending order, ships it, and marks it as either delivered (auto-paid) or returned (auto-restocked).

**Acceptance Scenarios**:

1. **Given** a merchant views their Orders list, **When** they look at a COD order, **Then** they see a distinct "COD" badge.
2. **Given** a COD order is in `pending_payment` status because it requires upfront delivery charge, **When** the merchant verifies the transaction ID and clicks "Confirm Payment" in the dashboard, **Then** the order status transitions to `processing`.
3. **Given** a merchant updates a COD order status to `delivered`, **When** the update completes, **Then** the order payment is automatically marked as fully paid/completed.
4. **Given** a COD order is rejected at the doorstep, **When** the merchant updates the order status to `returned`, **Then** the order status changes to `returned` and all order items' stock counts are automatically restored to inventory.

### Edge Cases

- What happens if a customer reaches the payment step with Cash on Delivery visible, but the merchant disables Cash on Delivery in their settings in the meantime? The order submission should return an error asking the customer to select an available payment method.
- What happens if a merchant downgrades their subscription plan to a tier that does not support Cash on Delivery? Cash on Delivery and "Pay Delivery Charge First" should be automatically disabled.
- What happens if a product goes out of stock between the address step (when the order is created in database) and the payment step when they confirm COD? The system must validate stock levels again before transitioning the order to `processing` or allowing payment submission.
- What happens if the upfront delivery charge transaction ID is rejected by the merchant? The order remains in `pending_payment` or can be marked as `cancelled` by the merchant, releasing stock.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow merchants to toggle Cash on Delivery (COD) payment method in Store Settings if their subscription plan supports it.
- **FR-002**: When Cash on Delivery is enabled, the settings page MUST display a sub-toggle "Pay Delivery Charge First" allowing merchants to require advance payment of the delivery charge.
- **FR-003**: Storefront checkout MUST display Cash on Delivery as a payment method option alongside bKash and Nagad when enabled by the merchant.
- **FR-004**: When Cash on Delivery is selected and "Pay Delivery Charge First" is disabled, checkout MUST hide the payment instructions and transaction ID input fields and display a delivery note.
- **FR-005**: When Cash on Delivery is selected and "Pay Delivery Charge First" is enabled, checkout MUST display instructions to pay the delivery charge amount via bKash/Nagad and require a valid transaction ID.
- **FR-006**: COD orders without upfront delivery charge payment MUST be created in the database and immediately set to the `processing` status (bypassing the `pending_payment` status).
- **FR-007**: COD orders requiring upfront delivery charge payment MUST be created in `pending_payment` status and transition to `processing` only when the merchant confirms the delivery charge transaction ID in the dashboard.
- **FR-008**: The merchant dashboard order lists and detail views MUST display a distinct "COD" badge or label for Cash on Delivery orders.
- **FR-009**: When a COD order (whether paying delivery charge first or full COD) is updated to `delivered` status, the system MUST automatically mark the payment as completed.
- **FR-010**: The system MUST support a new order status `returned` for doorstep rejections or customer returns.
- **FR-011**: When an order status is updated to `returned`, the system MUST automatically restore all allocated stock counts for that order back to the inventory.

### Key Entities *(include if feature involves data)*

- **Merchant**: Represents the store owner. Attributes: `codEnabled` (boolean), `payDeliveryChargeFirst` (boolean), `bkashWalletNumber` (string), `nagadWalletNumber` (string).
- **Order**: Represents the customer purchase. Attributes: `status` (stages: pending_payment, processing, shipped, delivered, cancelled, returned).
- **Payment Confirmation**: Represents the payment detail associated with an order. Attributes: `paymentMethod` (bkash, nagad, cod), `transactionId` (contains "COD" for standard COD, or the actual transaction ID for upfront delivery charge).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Customers selecting standard Cash on Delivery can complete the payment step of checkout in under 15 seconds.
- **SC-002**: 100% of standard COD orders (without advance payment) successfully bypass the manual merchant payment verification step and enter the "Processing" stage immediately upon submission.
- **SC-003**: 100% of COD orders requiring advance delivery charge are correctly created as `pending_payment` and block merchant fulfillment until the transaction ID is verified.
- **SC-004**: 100% of orders transitioning to `returned` status successfully restore stock counts within 1 second of the status update.
- **SC-005**: System prevents 100% of merchants on plans that do not include the COD feature from enabling Cash on Delivery or Pay Delivery Charge First in settings.

## Assumptions

- **A-001**: Customers opting for COD understand they must pay the courier the remaining balance in cash at the time of delivery.
- **A-002**: The merchant's delivery service supports Cash on Delivery collection.
- **A-003**: Upfront delivery charges are collected via bKash or Nagad using the merchant's configured personal wallet numbers.
