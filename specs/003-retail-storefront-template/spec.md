# Feature Specification: Retail Storefront Template & Flash Sales

**Feature Branch**: `003-retail-storefront-template`

**Created**: 2026-07-15

**Status**: Draft

**Input**: User description: "i want a new template. exatcly like this. nothing left behind. if my current schema need to update then we will, if any new feature is needed well build but nothing left behind and the ui design must be 100% like this. 1:1 pixel perfect. use grill me and lets discuss. dont make implementation plan until i say so."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Managing Flash Sales in Admin Dashboard (Priority: P1)

Merchants can set up, update, and end flash sales on their products directly from the admin dashboard to drive urgent sales.

**Why this priority**: Core promotional feature requested to drive customer engagement. This is critical for merchants to manage time-limited deals.

**Independent Test**: Can be tested independently by logging into the admin panel, creating a flash sale record for a specific product, and saving it.

**Acceptance Scenarios**:

1. **Given** a merchant is logged into the admin dashboard, **When** they navigate to the "Flash Sales" page and create a new flash sale specifying a product, a discounted price, a stock limit, and the start/end times, **Then** the flash sale is saved and displays in the list of sales.
2. **Given** a merchant is on the Flash Sales page, **When** they edit an existing flash sale (e.g. updating the discount price or stock limit), **Then** the updates are saved and reflected immediately on the storefront.
3. **Given** an active flash sale, **When** a merchant clicks "End Sale", **Then** the sale status is updated to inactive immediately, and the storefront product price reverts to its standard value.

---

### User Story 2 - Shopping Flash Sales with Real-Time Stock & Countdown (Priority: P1)

Shoppers can view active flash sales on the storefront, see how much stock is left via a progress bar, track remaining time with a live countdown timer, and purchase the items at the discounted price.

**Why this priority**: Essential customer-facing interaction that delivers the promotional value.

**Independent Test**: Placing a product on flash sale, adding it to the cart, checking out, and verifying that the correct discounted price is snapshotted, stock is decremented, and the flash sale "sold count" increments.

**Acceptance Scenarios**:

1. **Given** a product has an active flash sale, **When** a shopper views the storefront homepage, **Then** they see the product listed under the "Flash Sale" section showing the discounted price, the original price (crossed out), a live countdown clock (HH:MM:SS), and a progress bar showing "0/10 Sold".
2. **Given** a shopper adds a flash-sale item to their cart, **When** they proceed through the checkout flow and place the order, **Then** the order item price is snapshotted at the discounted flash sale price, and the flash sale's sold count increments by the quantity purchased.
3. **Given** a flash sale has a stock limit of 10 and 9 items have been sold, **When** a shopper purchases the 10th item, **Then** the sale sold count updates to 10, the progress bar shows "10/10 Sold", and the product immediately reverts to its standard price on subsequent page loads.

---

### User Story 3 - Configuring Category Images in Admin (Priority: P2)

Merchants can assign a custom square image or icon to their categories in the admin dashboard so that they display as visual buttons on the storefront categories row.

**Why this priority**: Enhances visual identity and enables the high-fidelity circular category row layout shown in the design.

**Independent Test**: Modifying a category in the category manager, uploading/linking a square image, saving, and checking if the storefront categories row updates.

**Acceptance Scenarios**:

1. **Given** a merchant is in the category manager, **When** they edit a category, upload or link a square image, and click save, **Then** the category record is updated with the image URL.
2. **Given** a category has a saved image, **When** a shopper opens the storefront homepage, **Then** that category is rendered in the horizontal categories row as a circular button displaying the custom image.

---

### User Story 4 - The visual "Retail" Storefront Template (Priority: P1)

Shoppers browse a beautiful, high-fidelity homepage layout containing a professional navigation header, category circle selectors, hero slider, flash sale showcase, todays curated grid, and themed footer.

**Why this priority**: Defines the core user experience and visual aesthetic. Must be a 1:1 pixel-perfect implementation of the target design.

**Independent Test**: Applying the `retail` template to a merchant store and visually inspecting that all UI elements, margins, font weights, colors (such as red prices and dark banners), and elements of the `retail` storefront match the target BeliBeli mockup with 1:1 pixel perfection.

**Acceptance Scenarios**:

1. **Given** a merchant selects the "Retail" storefront template, **When** a visitor loads the storefront homepage, **Then** they see a top header bar with quick links, a main header row with the storefront logo, a category dropdown, a search input, and action icons (cart, notifications, profile).
2. **Given** the retail template is active, **When** a shopper scrolls down the homepage, **Then** they see the horizontal circular category row, the hero slider with dot indicators, a Flash Sale section with red countdown timers, a "Todays For You!" product list with category tabs, a dark shadow banner saying *"Let's Shop Beyond Boundaries"*, and a detailed navy-blue footer.

### User Story 5 - Bulk Launching Flash Sales in Admin Dashboard (Priority: P2)
 
Merchants can bulk schedule and launch multiple flash sale campaigns simultaneously from a single page by selecting products and editing their prices, stock limits, and active durations in a centralized editable table.
 
**Why this priority**: Enhances merchant operations efficiency when running large promotional events with dozens of products.
 
**Independent Test**: Select multiple products on the bulk launch page, populate the values, click submit, and verify all corresponding flash sales are successfully saved and displayed in the main sales listing.
 
**Acceptance Scenarios**:
 
1. **Given** a merchant is logged in, **When** they click "Bulk Launch" on the Flash Sales index page, **Then** they are redirected to a dedicated bulk launch workspace.
2. **Given** a merchant is on the bulk launch page, **When** they search and select multiple products in a searchable combobox, **Then** an editable table automatically appends rows for those products.
3. **Given** the bulk launch table is loaded, **When** the merchant enters values in the global discount header (e.g. 30% discount, limit 20) and clicks "Apply", **Then** all rows pre-calculate and update their discounted prices and stock limits accordingly.
4. **Given** the table is filled, **When** the merchant submits the bulk launch form, **Then** all campaigns are saved atomically inside a single transaction, or rolled back completely if any single item fails validation.
 
---

### Edge Cases

- **Sale Ends During Checkout**: What happens if a shopper places a flash sale item in their cart, but the sale ends or sells out before they complete payment? The system MUST recalculate the cart total during checkout validation, reject the discounted price, display a clear warning message, and allow the user to purchase the items at the standard price.
- **Concurrent Checkout Race Conditions**: What happens if multiple shoppers submit payment for the final available flash sale item simultaneously? The database order transaction MUST lock the flash sale row, check that `soldQuantity + requestedQuantity <= limitQuantity`, and reject any order that exceeds the stock limit, throwing an out-of-stock validation error.
- **Missing Category Images**: What happens if a merchant creates a category but does not upload a square image? The storefront categories row MUST dynamically map the category name to a preset icon or display a clean, fallback placeholder containing the category initials.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated "Flash Sales" interface in the admin panel.
- **FR-002**: System MUST support creating a flash sale by specifying: product or specific product variant, discounted sale price (in Paisa), stock limit, start date/time, and end date/time.
- **FR-003**: System MUST check if a flash sale is active (current time is between start and end times, active is true, and sold count < stock limit) before serving storefront prices.
- **FR-004**: System MUST validate flash sale pricing and remaining stock limits transactionally inside the `createOrder` database process to ensure absolute inventory integrity, prioritizing variant-level promotions.
- **FR-005**: System MUST extend the category schema and admin form to support a square image upload or image path.
- **FR-006**: System MUST export the new storefront template (generic name `retail`) containing custom components for `HomePage`, `Navbar`, `Footer`, `PLP`, `PDP`, and `CartPage`.
- **FR-007**: System MUST render a live client-side countdown timer in the storefront Flash Sale block that updates every second and disables the discount once it reaches zero.
- **FR-008**: System MUST display a progress bar indicating the sold ratio (`soldQuantity / limitQuantity`) for each product card in the active flash sale.
- **FR-009**: System MUST support bulk launching of flash sales via a single atomic API transaction.
- **FR-010**: System MUST offer pre-calculation bulk-apply helpers (discount percentage, default stock limit, start/end dates) to quickly populate the editable workspace list.
- **FR-011**: System MUST render a stacked, 2-column input card layout on mobile viewports for bulk launch workspaces to prevent horizontal page overflow.

### Key Entities *(include if feature involves data)*

- **FlashSale**: Represents a time-limited promotional discount on a product or variant.
  - `id`: Unique identifier (string).
  - `merchantId`: Links to the merchant owner (string).
  - `productId`: Links to the discounted product (string).
  - `variantId`: Links to the specific product variant (string, optional/nullable).
  - `salePricePaisa`: The promotional price in Paisa (integer).
  - `limitQuantity`: The maximum quantity available at the sale price (integer).
  - `soldQuantity`: The number of items purchased at the sale price (integer).
  - `startTime` / `endTime`: The temporal boundaries of the sale (timestamp).
  - `isActive`: Boolean flag to manually toggle the sale.
- **Category**: Represents a product collection, enhanced with:
  - `imageUrl`: The URL or path to the custom square image (string, optional).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Merchants can configure and launch a new flash sale in less than 30 seconds.
- **SC-002**: 100% of checkout transactions for active flash sales are validated server-side, preventing overselling past the stock limit.
- **SC-003**: The storefront countdown timer updates instantly in real-time, syncing to the server's time coordinates with sub-second accuracy.
- **SC-004**: The visual layouts, margins, font weights, colors (such as red prices and dark banners), and elements of the `retail` storefront match the target BeliBeli mockup with 1:1 pixel perfection.
- **SC-005**: 100% of bulk launches are processed atomically; if any single validation fails, the entire batch rolls back, and inline table errors are flagged for correction.
- **SC-006**: Merchants can select and launch promotions for specific product variants (SKUs) with separate pricing, stock boundaries, and active timelines.

## Assumptions

- A single product can only belong to one active flash sale at any given time.
- Standard image formats (PNG, JPEG, WebP) are uploaded by merchants for category icons.
- Currency rendering matches the store's default locale settings (e.g., converting Paisa to Rupiah or Taka dynamically).
