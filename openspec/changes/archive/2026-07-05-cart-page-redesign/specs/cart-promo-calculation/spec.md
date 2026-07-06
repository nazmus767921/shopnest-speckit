## ADDED Requirements

### Requirement: Interactive Promo Code Discount Calculations
The cart summary MUST support interactive client-side promo code validation. The system SHALL allow the user to type a promo code and click "Apply". Valid codes (e.g. `DISCOUNT20`, `SHOP20`, `20OFF`) MUST apply a 20% discount to the cart subtotal, while invalid codes MUST render an inline error message without altering the calculations.

#### Scenario: Successfully applying a promo code
- **WHEN** the user inputs `"DISCOUNT20"` in the promo input box and clicks `"Apply"`
- **THEN** the summary displays a discount row representing `Discount (-20%)` with a value of `-20%` of the subtotal in red text, and subtracts this value from the grand total.

#### Scenario: Applying an invalid promo code
- **WHEN** the user inputs an invalid code and clicks `"Apply"`
- **THEN** the system displays a validation error message `"Invalid promo code. Try 'DISCOUNT20'."` and the totals remain unaffected.

### Requirement: Cart Order Summary Billing Breakdown
The cart order summary MUST show a detailed billing breakdown including subtotal, discount, delivery fee, and grand total. The delivery fee MUST be a flat `৳15.00` if the cart has items, and the total MUST be computed as `Subtotal - Discount + Delivery Fee`.

#### Scenario: Calculating order summary totals
- **WHEN** the cart has items and no promo code is applied
- **THEN** the summary displays the subtotal, a delivery fee of `৳15.00`, no discount row, and a total equal to `Subtotal + ৳15.00`.
