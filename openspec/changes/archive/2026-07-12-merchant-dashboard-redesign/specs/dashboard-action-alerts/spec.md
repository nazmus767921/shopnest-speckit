## ADDED Requirements

### Requirement: Recent Orders Feed
The dashboard MUST display a "Recent Orders" feed in the left column of the middle section, showing the 5 to 10 most recent orders. Each order row MUST include the order ID, customer name, total amount, a status badge (pending_payment, processing, shipped, delivered, cancelled), and a relative timestamp.

#### Scenario: Viewing Recent Orders
- **WHEN** the merchant views the middle section of the dashboard
- **THEN** they see a feed of their latest orders, allowing them to quickly check recent activity.

### Requirement: Orders Needing Attention Alert
The dashboard MUST display an "Orders Needing Attention" alert card in the right column of the middle section. This card MUST show the count of orders that are in the `pending_payment` status AND have an associated `payment_confirmation` record submitted by the customer. The card MUST link directly to the orders list filtered by pending_payment.

#### Scenario: Actioning Pending Verifications
- **WHEN** the merchant has customers who have submitted payment confirmations
- **THEN** the Orders Needing Attention card displays a count greater than 0, prompting the merchant to verify the payments.

### Requirement: Low Stock Alert
The dashboard MUST display a "Low Stock Products" alert card in the right column of the middle section. This card MUST show the count of active products where `stock_count` is greater than 0 but less than or equal to `low_stock_threshold`. It MUST list the top 3 affected products and link to the filtered products list.

#### Scenario: Monitoring Low Stock
- **WHEN** the merchant has products running low on inventory
- **THEN** the Low Stock Products card displays a warning count and lists the most critical items to restock.

### Requirement: Out of Stock Alert
The dashboard MUST display an "Out of Stock Products" alert card in the right column of the middle section. This card MUST show the count of active, published products where `stock_count` is exactly 0. It MUST feature destructive styling (red) to indicate high severity, list the top 3 affected products, and link to the filtered products list.

#### Scenario: Monitoring Depleted Inventory
- **WHEN** the merchant has published products with 0 stock
- **THEN** the Out of Stock Products card displays a severe warning, prompting immediate action to restock or unpublish the items.
