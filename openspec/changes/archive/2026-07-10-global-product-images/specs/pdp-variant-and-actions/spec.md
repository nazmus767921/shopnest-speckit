## ADDED Requirements

### Requirement: Variant Selection Independence from Gallery
Variant selectors (color swatches, size pills, dropdowns) SHALL operate independently of the main product image gallery. Selecting a variant MUST NOT trigger any image changes or filters in the gallery component.

#### Scenario: Selecting a variant color
- **WHEN** a user clicks on a variant color swatch
- **THEN** the variant is selected, but the main image gallery does not update to a variant-specific image.
