# Data Model Design: Retail Storefront Template & Flash Sales

This document describes the database schema modifications and RLS policies for the categories image upgrade and the new flash sales feature.

## 1. Categories Table Upgrade

We add a new column to the existing `categories` table.

```typescript
// db/schema.ts
export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  parentId: text("parent_id").references((): AnyPgColumn => categories.id, { onDelete: "cascade" }),
  imageUrl: text("image_url"), // <-- NEW: Path or URL for the square category icon
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("categories_merchant_id_slug_idx").on(table.merchantId, table.slug),
]).enableRLS()
```

---

## 2. Flash Sales Table

We create a new table `flash_sales` to record time-limited promotion campaigns.

```typescript
// db/schema.ts
export const flashSales = pgTable("flash_sales", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  salePricePaisa: integer("sale_price_paisa").notNull(),
  limitQuantity: integer("limit_quantity").notNull(),
  soldQuantity: integer("sold_quantity").notNull().default(0),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("flash_sales_merchant_id_idx").on(table.merchantId),
  index("flash_sales_product_id_idx").on(table.productId),
]).enableRLS()
```

### Relations
We define a Drizzle relations helper to link `flashSales` to products:
```typescript
export const flashSalesRelations = relations(flashSales, ({ one }) => ({
  merchant: one(merchants, {
    fields: [flashSales.merchantId],
    references: [merchants.id],
  }),
  product: one(products, {
    fields: [flashSales.productId],
    references: [products.id],
  }),
}))
```

---

## 3. RLS (Row Level Security) Policies

To protect merchant tenancy isolation (Invariant 1):

### categories
Ensure that any read/write operations check that the authenticated merchant matches `merchant_id`. The categories table already has RLS enabled. We will ensure the policies cover the image field.

### flash_sales
Enforce multi-tenant access controls:
* **SELECT**: Open to public for active sales so storefront visitors can query prices, but restricted by `merchant_id` for dashboard users.
* **INSERT/UPDATE/DELETE**: Restricted to authenticated users belonging to the matching `merchantId`.

```sql
ALTER TABLE "flash_sales" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to active flash sales"
ON "flash_sales" FOR SELECT
USING (is_active = true);

CREATE POLICY "Allow merchants full control of their own flash sales"
ON "flash_sales" FOR ALL
TO authenticated
USING (merchant_id = (SELECT id FROM merchants WHERE owner_id = auth.uid()))
WITH CHECK (merchant_id = (SELECT id FROM merchants WHERE owner_id = auth.uid()));
```
