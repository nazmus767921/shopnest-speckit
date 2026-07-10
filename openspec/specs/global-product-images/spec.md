# Global Product Images

## Purpose
TBD: Defines global product images behavior and prevents variant-specific image assignments.

## Requirements

### Requirement: Global Product Images
The system SHALL support image uploads only at the product level, creating a global pool of images shared across all variants of that product.

#### Scenario: Image upload at product level
- **WHEN** a merchant uploads images to a product
- **THEN** the images are associated with the product ID and displayed in the main product gallery, regardless of variant selection.

### Requirement: Variant Image Upload Removal
The system MUST NOT allow merchants to upload images specific to a product variant, and MUST NOT associate images with variant IDs in the database or UI.

#### Scenario: Variant creation without image upload
- **WHEN** a merchant creates or edits a product variant
- **THEN** there is no option to upload or associate an image specifically for that variant.
