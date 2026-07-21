# Validation & Testing Quickstart Guide: Retail Template & Flash Sales

This guide describes end-to-end scenarios to validate that the new `retail` template, category images, and flash sale logic function correctly.

## 1. Prerequisites
- Start database connection.
- Ensure at least one merchant account and a few published products exist.

---

## 2. Scenario 1: Category Image Configuration & Storefront Presentation
1. Log into the merchant dashboard and navigate to **Category Management** (`/dashboard/categories`).
2. Create or edit a category. 
3. Populate the **Category Image URL** field with a square image (e.g. `/storage/v1/object/public/media/category-tshirt.png`).
4. Save the category.
5. In the storefront setting, ensure the template is set to `retail`.
6. Open the storefront homepage and verify that the category row renders the category as a circular button displaying your uploaded image.

---

## 3. Scenario 2: Launching a Flash Sale Campaign
1. Log into the merchant dashboard and navigate to the new **Flash Sales** page (`/dashboard/flash-sales`).
2. Click **Create Flash Sale**.
3. Select a product, set a promotional price (e.g., Rp150.000), set a limit quantity (e.g. 10), set the start time (future) and end time (future).
4. Save the sale. Verify it appears on the list.

---

## 4. Scenario 3: Storefront Purchase & Inventory Deductions
1. With the flash sale created in Scenario 2 active (simulate by adjusting start time to past in the database if testing immediately):
2. Load the storefront homepage under the `retail` template.
3. Verify the product card renders under the **Flash Sale** section with:
   - The discounted sale price in red.
   - The original price struck-through.
   - A ticking countdown timer.
   - A progress bar displaying `0/10 Sold`.
4. Click the card, add the item to the cart, and complete checkout.
5. Once the order is placed, check:
   - **Database order_items**: The unit price is snapshotted at Rp150.000.
   - **Flash Sales list**: The `soldQuantity` increments to `1`.
   - **Storefront page**: The progress bar updates to `1/10 Sold`.

---

## 5. Scenario 4: Flash Sale Depletion & Price Reversion
1. Artificially increment the `soldQuantity` in the database to `9`.
2. Add the product to a customer cart, complete checkout.
3. Once the 10th item is purchased:
   - Verify that the storefront progress bar displays `10/10 Sold`.
   - Refresh the page and confirm the product is no longer shown under the active Flash Sale price, and standard storefront elements render its regular price.
   - Try to add the product to cart and verify standard price is used.
