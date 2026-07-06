## ADDED Requirements

### Requirement: Accumulated Variant Stock Synchronization
For any product that has variants (`hasVariants` is true), the database record `products.stockCount` MUST represent the accumulated sum of `stockCount` values from all its active variants. This synchronization MUST occur during:
1. Initial attribute saving and variant generation.
2. Individual variant stock level updates.
3. Bulk variant stock level updates.
4. Ordering processes (stock decrements).
5. Cancellation/returning processes (stock restorations).

#### Scenario: Variant stock count updates parent product stock count
- **WHEN** a merchant saves attributes, edits variant stock, or an order is submitted or cancelled
- **THEN** the parent product's `stockCount` is updated to equal the sum of all its active variants' stock counts

### Requirement: ProductForm Stock Override Prevention
When editing a product via `ProductForm`, if the product has variants, the form's submitted base stock level MUST NOT overwrite the accumulated variant stock count in the database.

#### Scenario: Form submission does not overwrite variant stock count
- **WHEN** a merchant edits a variant-enabled product's general details in the Product Info tab and saves
- **THEN** the database ignores the form's submitted stock count value, preserving the accumulated variant stock count

### Requirement: Read-Only Dashboard Stock Indicator
The products list view MUST NOT render interactive stock editing widgets (`InlineStockWidget`) for products that have variants, rendering a read-only badge indicating variant-level management instead.

#### Scenario: Products list disables inline stock edit for variant products
- **WHEN** the dashboard products list is rendered and a product has `hasVariants` as true
- **THEN** a read-only stock level text badge indicating "(Variants)" is displayed instead of the `InlineStockWidget` stepper
