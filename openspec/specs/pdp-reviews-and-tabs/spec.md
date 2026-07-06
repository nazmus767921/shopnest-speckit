# pdp-reviews-and-tabs Specification

## Purpose
TBD - created by archiving change pdp-redesign. Update Purpose after archive.
## Requirements
### Requirement: Product Detail Tabs
The PDP SHALL render a horizontal tab system showing "Product Details", "Rating & Reviews", and "FAQs", with the active tab indicated by a black underline.

#### Scenario: Switching active tab contents
- **WHEN** a user clicks on the "Rating & Reviews" tab
- **THEN** the active tab updates to render the reviews list section, highlighting the tab text with a black underline.

### Requirement: Star Ratings and Verified Review Cards
Review cards SHALL use transparent background with a 1px solid hairline border, `{rounded.md}` (16px), containing star count, verified name badge, description, and date posted.

#### Scenario: Verified reviewer card structure
- **WHEN** reviews are rendered on the page
- **THEN** each review card displays a row of yellow stars (`#FFC633`), the reviewer's name with a green checkmark icon, the review body, and a "Posted on [Date]" footnote in Satoshi font.

### Requirement: Reviews Grid and Controls
The reviews section SHALL display a header "All Reviews (count)", a filter action button, a sorting dropdown, a "Write a Review" black pill button, and a 2-column grid layout on desktop viewports.

#### Scenario: Reviews list responsive layout
- **WHEN** a user views reviews on viewport width >= 1024px
- **THEN** the review cards list is structured in a two-column grid.

