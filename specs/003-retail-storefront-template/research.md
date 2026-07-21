# Research & Architectural Decisions: Retail Storefront Template & Flash Sales

This document outlines the technical research, architectural decisions, and alternatives considered for implementing the generic `retail` template, category image upload, and merchant flash sales.

## 1. Schema Extensions & Storage

### Category Images
* **Decision**: Add an optional `image_url` column to the `categories` table.
* **Rationale**: Required to dynamically render custom circular category icons on the storefront.
* **Alternatives Considered**: 
  - *Hardcoded template icons*: Rejected because the user explicitly requested extending the category admin feature to support dynamic square category images.
  - *Storing images in metadata jsonb*: Rejected. A direct database text column is cleaner, more performant, and type-safe for querying.

### Flash Sales
* **Decision**: Create a dedicated `flash_sales` table rather than using generic product columns or discount code tables.
* **Rationale**: A flash sale has a specific temporal boundary (start/end times) and an inventory cap (stock limit) independent of standard product stock. A dedicated table decouples standard pricing/inventory from time-limited promotions.
* **Schema Design**:
  - `id`: unique UUID
  - `merchantId`: for multi-tenant isolation (Invariant 1)
  - `productId`: targeted product
  - `salePricePaisa`: promotional price
  - `limitQuantity`: total items offered at this price
  - `soldQuantity`: counter incremented transactionally upon checkout
  - `startTime` / `endTime`: active timeframe
  - `isActive`: manual toggle

---

## 2. Storefront Rendering & Caching

* **Decision**: Use Next.js `use cache` for storefront queries, invalidating via tags when flash sales or categories change.
* **Rationale**: Stores must load instantly. However, since flash sales are highly dynamic (real-time stock and countdown), the active flash sale lookup will bypass long caching or use highly granular tags.
* **Timer implementation**: The countdown timer will be implemented as a client-side React component that calculates remaining seconds relative to the server-provided `endTime` timestamp. This prevents static compilation mismatches and ensures the timer is live and precise.
* **RSC Boundary**: The outer structure of the template (header, categories bar, layouts) will be Server Components. The countdown timer, interactive wishlist hearts, and category filter tabs will be isolated `"use client"` leaf nodes, adhering to the project's RSC-by-default rule.

---

## 3. Transactional Integrity (Checkout)

* **Decision**: Validate and decrement flash sale limits within the same Postgres transaction as order creation.
* **Rationale**: Ensures that if a flash sale is limited to 10 items, no more than 10 items can be sold at the promotional price under concurrent load (Invariant 2 & 3).
* **Checkout Flow**:
  1. `createOrder` runs in a transaction.
  2. Select active flash sale for product `FOR UPDATE` (pessimistic lock).
  3. Verify `soldQuantity + quantity <= limitQuantity`. If it fails, throw an out-of-stock error.
  4. Increment `soldQuantity` on the flash sale record.
  5. Save the snapshotted price to `order_items.unit_price`.
