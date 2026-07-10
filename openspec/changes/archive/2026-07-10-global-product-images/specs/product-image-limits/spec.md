## ADDED Requirements

### Requirement: Subscription Plan Image Limits
The system SHALL enforce a maximum number of product images per product. This limit MUST be dynamically fetched from the merchant's active subscription plan.

#### Scenario: Merchant within limit uploads image
- **WHEN** a merchant with a 10-image limit tries to upload the 5th image to a product
- **THEN** the system allows the upload and saves the image to the global pool.

#### Scenario: Merchant exceeds limit
- **WHEN** a merchant attempts to upload images that would cause the total product images to exceed their active subscription plan limit
- **THEN** the system rejects the upload and displays an error message indicating the limit has been reached.
