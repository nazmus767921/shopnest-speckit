# product-variant-bulk-edit-pricing Specification

## Purpose
TBD - created by archiving change fix-variant-bulk-discount. Update Purpose after archive.
## Requirements
### Requirement: Signed Value Constraints for Variant Bulk Price Adjustments
The variant bulk editor price adjustment inputs SHALL enforce the following numeric limits based on the selected adjustment type:
1. **Fixed (৳)**: The value MUST be non-negative (>= 0) to prevent setting a negative base price.
2. **Percent (%)**: The value MUST accept negative numbers down to -100 (>= -100) to support discounts, and positive numbers for markups.
3. **Add Amount (+/- ৳)**: The value SHALL accept both positive and negative numbers to support relative additions or subtractions.

#### Scenario: Percent adjustment allows negative values for discounts
- **WHEN** the merchant selects the percent (%) adjustment type in the bulk price editor
- **THEN** the input field accepts negative values down to -100

#### Scenario: Fixed adjustment restricts input to non-negative values
- **WHEN** the merchant selects the fixed (৳) adjustment type in the bulk price editor
- **THEN** the input field restricts values to greater than or equal to 0

#### Scenario: Add amount adjustment allows negative values
- **WHEN** the merchant selects the add amount (+/- ৳) adjustment type in the bulk price editor
- **THEN** the input field accepts negative values

