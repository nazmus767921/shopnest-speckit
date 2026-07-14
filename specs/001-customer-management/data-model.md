# Data Model: Storefront Customer Portal & Admin Management

This document defines the schema changes, indexes, and validation rules required to support isolated customer accounts, addresses, and IP banning.

## 1. Schema Modifications

### `user` (Drizzle Update)
We add a relationship to `merchants` and update indexes to allow multiple records with the same email if they belong to different merchants.

```typescript
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(), // Remove unique() at table definition level
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  isAnonymous: boolean("isAnonymous"),
  role: text("role"), // 'admin' | 'merchant' | 'customer'
  merchantId: text("merchant_id").references(() => merchants.id, { onDelete: "cascade" }),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
}, (table) => [
  // Unique constraint for storefront customer emails (isolated by merchant)
  uniqueIndex("user_email_merchant_id_unique_idx").on(table.email, table.merchantId),
])
```

---

## 2. New Schema Tables

### `customer_addresses`
Stores customer shipping and billing addresses scoped to each customer and merchant.

```typescript
export const customerAddresses = pgTable("customer_addresses", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("customer_addresses_user_merchant_idx").on(table.userId, table.merchantId),
]).enableRLS()
```

### `banned_ips`
Tracks IP addresses banned by a specific merchant admin.

```typescript
export const bannedIps = pgTable("banned_ips", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("banned_ips_merchant_ip_idx").on(table.merchantId, table.ipAddress),
]).enableRLS()
```

---

## 3. Relationships

```typescript
export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  user: one(user, {
    fields: [customerAddresses.userId],
    references: [user.id],
  }),
  merchant: one(merchants, {
    fields: [customerAddresses.merchantId],
    references: [merchants.id],
  }),
}))

export const bannedIpsRelations = relations(bannedIps, ({ one }) => ({
  merchant: one(merchants, {
    fields: [bannedIps.merchantId],
    references: [merchants.id],
  }),
}))
```
