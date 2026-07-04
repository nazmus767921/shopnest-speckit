import { pgTable, text, jsonb, timestamp, boolean, integer, numeric, index, uniqueIndex } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import type { PlanFeatures } from "@/lib/plans/types"

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  isAnonymous: boolean("isAnonymous"),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
}).enableRLS()

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
}, (table) => [
  index("session_userId_idx").on(table.userId),
]).enableRLS()

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
}, (table) => [
  index("account_userId_idx").on(table.userId),
]).enableRLS()

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
}, (table) => [
  index("verification_identifier_value_idx").on(table.identifier, table.value),
]).enableRLS()

export const twoFactor = pgTable(
  "two_factor",
  {
    id: text("id").primaryKey(),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    verified: boolean("verified").default(true),
  },
  (table) => [
    index("twoFactor_secret_idx").on(table.secret),
    index("twoFactor_userId_idx").on(table.userId),
  ]
).enableRLS()


export const merchants = pgTable("merchants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  subdomain: text("subdomain").notNull().unique(),
  ownerId: text("owner_id").references(() => user.id, { onDelete: "set null" }),
  plan: text("plan").default("starter").notNull(), // starter | growth
  subscriptionStatus: text("subscription_status").default("trial").notNull(), // trial | active | suspended | cancelled
  trialExpiry: timestamp("trial_expiry").notNull(),
  bkashNumber: text("bkash_number"),
  nagadNumber: text("nagad_number"),
  phoneNumber: text("phone_number"),
  lowStockThresholdDefault: integer("low_stock_threshold_default").notNull().default(5),
  heroImageUrl: text("hero_image_url"),
  subtitle: text("subtitle"),
  storeDescription: text("store_description"),
  storeAddress: text("store_address"),
  socialLinks: jsonb("social_links").$type<Record<string, string>>(), // jsonb: { facebook?, instagram?, whatsapp?, tiktok? }
  customFaqs: jsonb("custom_faqs").$type<Array<{ question: string; answer: string }>>(), // jsonb: Array<{ question, answer }>
  telegramChatId: text("telegram_chat_id"), // Opt-in Telegram Chat ID for order notifications
  codEnabled: boolean("cod_enabled").notNull().default(false),
  payDeliveryChargeFirst: boolean("pay_delivery_charge_first").notNull().default(false),
  bkashWalletNumber: text("bkash_wallet_number"),
  nagadWalletNumber: text("nagad_wallet_number"),
}, (table) => [
  index("merchants_owner_id_idx").on(table.ownerId),
  index("merchants_subscription_status_idx").on(table.subscriptionStatus),
]).enableRLS()

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  pricePaisa: integer("price_paisa").notNull(),
  stockCount: integer("stock_count").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  hasVariants: boolean("has_variants").notNull().default(false),
  variantGeneration: jsonb("variant_generation"),
  metadataCount: integer("metadata_count").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("products_merchant_id_idx").on(table.merchantId),
  index("products_merchant_published_deleted_idx").on(table.merchantId, table.isPublished, table.deletedAt),
  index("products_merchant_created_at_idx").on(table.merchantId, table.createdAt),
  index("products_slug_merchant_idx").on(table.slug, table.merchantId),
  index("products_category_id_idx").on(table.categoryId),
]).enableRLS()

export const productImages = pgTable("product_images", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  storagePath: text("storage_path").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("product_images_product_id_idx").on(table.productId),
  index("product_images_merchant_id_idx").on(table.merchantId),
]).enableRLS()

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  guestPhone: text("guest_phone"),
  status: text("status").notNull().default("pending_payment"),
  deliveryName: text("delivery_name").notNull(),
  deliveryPhone: text("delivery_phone").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryCity: text("delivery_city").notNull(),
  deliveryChargePaisa: integer("delivery_charge_paisa").notNull().default(0),
  totalPaisa: integer("total_paisa").notNull(),
  discountPaisa: integer("discount_paisa").notNull().default(0),
  discountCodeId: text("discount_code_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("orders_merchant_id_idx").on(table.merchantId),
  index("orders_merchant_created_at_idx").on(table.merchantId, table.createdAt),
  index("orders_merchant_status_idx").on(table.merchantId, table.status),
  index("orders_user_id_idx").on(table.userId),
  index("orders_guest_phone_idx").on(table.guestPhone),
]).enableRLS()

export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  productName: text("product_name").notNull(),
  unitPricePaisa: integer("unit_price_paisa").notNull(),
  quantity: integer("quantity").notNull(),
  variantId: text("variant_id"),
  variantLabel: text("variant_label"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("order_items_order_id_idx").on(table.orderId),
  index("order_items_merchant_id_idx").on(table.merchantId),
  index("order_items_product_id_idx").on(table.productId),
]).enableRLS()

export const paymentConfirmations = pgTable("payment_confirmations", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" })
    .unique(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  paymentMethod: text("payment_method").notNull(), // bkash | nagad
  transactionId: text("transaction_id").notNull(),
  confirmedAt: timestamp("confirmed_at"),
  confirmedBy: text("confirmed_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("payment_confirmations_order_id_idx").on(table.orderId),
  index("payment_confirmations_merchant_id_idx").on(table.merchantId),
]).enableRLS()

export const emailLogs = pgTable("email_logs", {
  id: text("id").primaryKey(),
  recipientEmail: text("recipient_email").notNull(),
  template: text("template").notNull(), // order_confirmed | order_shipped | order_delivered
  orderId: text("order_id")
    .references(() => orders.id, { onDelete: "set null" }),
  status: text("status").notNull(), // success | failed
  sentAt: timestamp("sent_at").notNull().defaultNow(),
}, (table) => [
  index("email_logs_order_id_idx").on(table.orderId),
]).enableRLS()

// ─── Discount Codes ──────────────────────────────────────────────────────────

export const discountCodes = pgTable("discount_codes", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  discountType: text("discount_type").notNull(), // fixed | percent
  value: numeric("value", { precision: 10, scale: 2 }).notNull(), // Taka amount or percentage
  usageLimit: integer("usage_limit"), // null = unlimited
  usageCount: integer("usage_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("discount_codes_merchant_id_idx").on(table.merchantId),
  uniqueIndex("discount_codes_merchant_code_unique_idx").on(table.merchantId, table.code),
]).enableRLS()

// ─── Subscription Plans ──────────────────────────────────────────────────────

export const subscriptionPlans = pgTable("subscription_plans", {
  id:         text("id").primaryKey(),
  name:       text("name").notNull(),           // e.g. "Starter"
  slug:       text("slug").notNull().unique(),   // e.g. "starter", "growth", "pro"
  pricePaisa: integer("price_paisa").notNull(),  // e.g. 49900 (৳499)
  isActive:   boolean("is_active").notNull().default(true),
  isArchived: boolean("is_archived").notNull().default(false),
  features:   jsonb("features")
                .$type<PlanFeatures>()
                .notNull(),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
  updatedAt:  timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("subscription_plans_slug_unique_idx").on(table.slug),
  index("subscription_plans_is_archived_idx").on(table.isArchived),
]).enableRLS()

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  plan: text("plan").notNull().default("starter"), // starter | growth
  planId: text("plan_id").references(() => subscriptionPlans.id, { onDelete: "set null" }),
  status: text("status").notNull().default("trial"), // trial | active | suspended | cancelled
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  // ── Limit Snapshot ─────────────────────────────────────────────
  snapshotProductLimit:   integer("snapshot_product_limit"),
  snapshotCategoryLimit:  integer("snapshot_category_limit"),
  snapshotDiscountLimit:  integer("snapshot_discount_limit"),
  snapshotImagesPerProduct: integer("snapshot_images_per_product"),
  snapshotImageSizeMb:    integer("snapshot_image_size_mb"),
  snapshotOrdersPerMonth: integer("snapshot_orders_per_month"),
  // ───────────────────────────────────────────────────────────────
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("subscriptions_merchant_id_idx").on(table.merchantId),
  index("subscriptions_status_idx").on(table.status),
]).enableRLS()

// ─── Subscription Payments ────────────────────────────────────────────────────

export const subscriptionPayments = pgTable("subscription_payments", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  amountPaisa: integer("amount_paisa").notNull(),
  paymentMethod: text("payment_method").notNull(), // bkash | nagad | bank
  transactionId: text("transaction_id").notNull(),
  status: text("status").notNull().default("pending"), // pending | verified | rejected
  months: integer("months").notNull().default(1),
  targetPlan: text("target_plan"), // starter | growth
  targetPlanId: text("target_plan_id").references(() => subscriptionPlans.id, { onDelete: "set null" }),
  // Snapshot of plan features at the moment the merchant submitted the payment.
  // Used at verification time so limit changes made between submission and
  // admin approval do not silently give the merchant the wrong limits.
  featuresAtPaymentTime: jsonb("features_at_payment_time").$type<PlanFeatures>(),
  recordedBy: text("recorded_by").references(() => user.id, { onDelete: "set null" }),
  paidAt: timestamp("paid_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("subscription_payments_merchant_id_idx").on(table.merchantId),
  index("subscription_payments_status_idx").on(table.status),
]).enableRLS()

// ─── Categories ──────────────────────────────────────────────────────────────

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("categories_merchant_id_slug_idx").on(table.merchantId, table.slug),
]).enableRLS()

// ─── Product Promotions ──────────────────────────────────────────────────────

export const productPromotions = pgTable("product_promotions", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  promotionType: text("promotion_type").notNull(), // 'featured' | 'new_arrival' | 'exclusive'
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("product_promotions_product_id_promotion_type_idx").on(table.productId, table.promotionType),
  index("product_promotions_merchant_id_idx").on(table.merchantId),
]).enableRLS()
// ─── Shipping Zones ──────────────────────────────────────────────────────────

// ─── Variant & Metadata Tables ────────────────────────────────────────────────

/**
 * Product attributes — defines the "columns" of the variant matrix.
 * Each attribute (e.g. Color, Size, Material) has a display type (dropdown/swatch/radio)
 * and a set of options stored in `attribute_options`. Max 3 attributes per product.
 * @see specs/20-product-variants-metadata/spec.md §FR-001
 */
export const productAttributes = pgTable("product_attributes", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  displayType: text("display_type").notNull().default("dropdown"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_product_attributes_product").on(table.productId, table.sortOrder),
  index("idx_product_attributes_merchant").on(table.merchantId),
]).enableRLS()

/**
 * Attribute option values — each option belongs to one attribute.
 * Options are the "rows" within each attribute column (e.g. "Red", "Blue" for Color).
 * Max 10 options per attribute. Variant matrix is the Cartesian product across attributes.
 * @see specs/20-product-variants-metadata/spec.md §FR-001
 */
export const attributeOptions = pgTable("attribute_options", {
  id: text("id").primaryKey(),
  attributeId: text("attribute_id")
    .notNull()
    .references(() => productAttributes.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  value: text("value").notNull(),
  swatchColor: text("swatch_color"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_attribute_options_attribute").on(table.attributeId, table.sortOrder),
  uniqueIndex("uq_attribute_options_attr_value").on(table.attributeId, table.value),
]).enableRLS()

/**
 * Product variants — auto-generated from the Cartesian product of attribute options.
 * Each variant has its own SKU (auto-generated or overridden), price (inherits base price
 * if null), stock count, and active status. Max 1000 variants per product.
 * @see specs/20-product-variants-metadata/spec.md §FR-002, FR-003
 */
export const productVariants = pgTable("product_variants", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  sku: text("sku").notNull(),
  pricePaisa: integer("price_paisa"),
  stockCount: integer("stock_count").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_product_variants_product").on(table.productId, table.sortOrder),
  index("idx_product_variants_merchant").on(table.merchantId),
  uniqueIndex("idx_product_variants_sku").on(table.sku),
  index("idx_product_variants_active").on(table.productId, table.isActive),
]).enableRLS()

export const variantAttributeLinks = pgTable("variant_attribute_links", {
  id: text("id").primaryKey(),
  variantId: text("variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "cascade" }),
  attributeOptionId: text("attribute_option_id")
    .notNull()
    .references(() => attributeOptions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_variant_links_variant").on(table.variantId),
  index("idx_variant_links_option").on(table.attributeOptionId),
  uniqueIndex("uq_variant_links_variant_option").on(table.variantId, table.attributeOptionId),
]).enableRLS()

/**
 * Variant images — stored in Supabase Storage `product-images` bucket.
 * Path format: `{merchant_id}/{product_id}/variants/{variant_id}/{uuid}.{ext}`.
 * Max 5 images per variant. Display order is user-controllable.
 * @see specs/20-product-variants-metadata/spec.md §FR-014
 */
export const variantImages = pgTable("variant_images", {
  id: text("id").primaryKey(),
  variantId: text("variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "cascade" }),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  storagePath: text("storage_path").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_variant_images_variant").on(table.variantId, table.displayOrder),
]).enableRLS()

export const productMetadata = pgTable("product_metadata", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: text("value").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_product_metadata_product").on(table.productId, table.sortOrder),
  uniqueIndex("uq_product_metadata_product_key").on(table.productId, table.key),
]).enableRLS()

export const shippingZones = pgTable("shipping_zones", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  deliveryChargePaisa: integer("delivery_charge_paisa").notNull().default(0),
  freeShippingThresholdPaisa: integer("free_shipping_threshold_paisa"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("shipping_zones_merchant_id_idx").on(table.merchantId),
]).enableRLS()

export const shippingZoneDistricts = pgTable("shipping_zone_districts", {
  id: text("id").primaryKey(),
  zoneId: text("zone_id")
    .notNull()
    .references(() => shippingZones.id, { onDelete: "cascade" }),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  division: text("division").notNull(),
  district: text("district").notNull(),
}, (table) => [
  uniqueIndex("shipping_zone_districts_zone_district_unique_idx").on(table.zoneId, table.district),
  index("shipping_zone_districts_merchant_id_idx").on(table.merchantId),
]).enableRLS()


// ─── Notification Queue ──────────────────────────────────────────────────────────────────

/**
 * Generic background dispatch queue for outbound notifications.
 * Channel-agnostic: supports telegram and sms (sms deferred to V3).
 * Consumed by dispatch-notifications Edge Function via pg_cron every 5s.
 */
export const notificationQueue = pgTable("notification_queue", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  channel: text("channel").notNull().default("telegram"), // telegram | sms
  recipient: text("recipient").notNull(), // telegram_chat_id or phone number
  messagePayload: text("message_payload").notNull(),
  status: text("status").notNull().default("pending"), // pending | processing | sent | failed
  errorMessage: text("error_message"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("notification_queue_status_created_at_idx").on(table.status, table.createdAt),
  index("notification_queue_merchant_id_idx").on(table.merchantId),
]).enableRLS()

/**
 * Per-merchant, per-event notification channel preferences.
 * Active in v1 for order_created + telegram only.
 * Seeded when merchant saves their Telegram Chat ID.
 */
export const notificationPreferences = pgTable("notification_preferences", {
  id: text("id").primaryKey(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // order_created | payment_confirmed | stock_low | order_shipped | order_delivered
  channel: text("channel").notNull(), // telegram | sms
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("notification_preferences_merchant_event_channel_unique")
    .on(table.merchantId, table.eventType, table.channel),
]).enableRLS()



// ─── Variant Relations ─────────────────────────────────────────────────────────

export const productAttributesRelations = relations(productAttributes, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [productAttributes.merchantId],
    references: [merchants.id],
  }),
  product: one(products, {
    fields: [productAttributes.productId],
    references: [products.id],
  }),
  options: many(attributeOptions),
}))

export const attributeOptionsRelations = relations(attributeOptions, ({ one, many }) => ({
  attribute: one(productAttributes, {
    fields: [attributeOptions.attributeId],
    references: [productAttributes.id],
  }),
  variantLinks: many(variantAttributeLinks),
}))

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [productVariants.merchantId],
    references: [merchants.id],
  }),
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  attributeLinks: many(variantAttributeLinks),
  images: many(variantImages),
}))

export const variantAttributeLinksRelations = relations(variantAttributeLinks, ({ one }) => ({
  variant: one(productVariants, {
    fields: [variantAttributeLinks.variantId],
    references: [productVariants.id],
  }),
  attributeOption: one(attributeOptions, {
    fields: [variantAttributeLinks.attributeOptionId],
    references: [attributeOptions.id],
  }),
}))

export const variantImagesRelations = relations(variantImages, ({ one }) => ({
  variant: one(productVariants, {
    fields: [variantImages.variantId],
    references: [productVariants.id],
  }),
  merchant: one(merchants, {
    fields: [variantImages.merchantId],
    references: [merchants.id],
  }),
}))

export const productMetadataRelations = relations(productMetadata, ({ one }) => ({
  product: one(products, {
    fields: [productMetadata.productId],
    references: [products.id],
  }),
  merchant: one(merchants, {
    fields: [productMetadata.merchantId],
    references: [merchants.id],
  }),
}))

// ─── Relations ────────────────────────────────────────────────────────────────

export const merchantsRelations = relations(merchants, ({ one, many }) => ({
  owner: one(user, {
    fields: [merchants.ownerId],
    references: [user.id],
  }),
  products: many(products),
  orders: many(orders),
  orderItems: many(orderItems),
  paymentConfirmations: many(paymentConfirmations),
  discountCodes: many(discountCodes),
  subscriptions: many(subscriptions),
  subscriptionPayments: many(subscriptionPayments),
  categories: many(categories),
  productPromotions: many(productPromotions),
  shippingZones: many(shippingZones),
  shippingZoneDistricts: many(shippingZoneDistricts),
  notificationQueue: many(notificationQueue),
  notificationPreferences: many(notificationPreferences),
  productAttributes: many(productAttributes),
  productVariants: many(productVariants),
  variantImages: many(variantImages),
  productMetadata: many(productMetadata),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [products.merchantId],
    references: [merchants.id],
  }),
  images: many(productImages),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  promotions: many(productPromotions),
  attributes: many(productAttributes),
  variants: many(productVariants),
  metadata: many(productMetadata),
}))

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [categories.merchantId],
    references: [merchants.id],
  }),
  products: many(products),
}))

export const productPromotionsRelations = relations(productPromotions, ({ one }) => ({
  product: one(products, {
    fields: [productPromotions.productId],
    references: [products.id],
  }),
  merchant: one(merchants, {
    fields: [productPromotions.merchantId],
    references: [merchants.id],
  }),
}))



export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
  merchant: one(merchants, {
    fields: [productImages.merchantId],
    references: [merchants.id],
  }),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [orders.merchantId],
    references: [merchants.id],
  }),
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
  items: many(orderItems),
  paymentConfirmation: one(paymentConfirmations, {
    fields: [orders.id],
    references: [paymentConfirmations.orderId],
  }),
  emailLogs: many(emailLogs),
}))

export const shippingZonesRelations = relations(shippingZones, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [shippingZones.merchantId],
    references: [merchants.id],
  }),
  districts: many(shippingZoneDistricts),
}))

export const shippingZoneDistrictsRelations = relations(shippingZoneDistricts, ({ one }) => ({
  zone: one(shippingZones, {
    fields: [shippingZoneDistricts.zoneId],
    references: [shippingZones.id],
  }),
  merchant: one(merchants, {
    fields: [shippingZoneDistricts.merchantId],
    references: [merchants.id],
  }),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  merchant: one(merchants, {
    fields: [orderItems.merchantId],
    references: [merchants.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}))

export const paymentConfirmationsRelations = relations(paymentConfirmations, ({ one }) => ({
  order: one(orders, {
    fields: [paymentConfirmations.orderId],
    references: [orders.id],
  }),
  merchant: one(merchants, {
    fields: [paymentConfirmations.merchantId],
    references: [merchants.id],
  }),
  confirmedByUser: one(user, {
    fields: [paymentConfirmations.confirmedBy],
    references: [user.id],
  }),
}))

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  order: one(orders, {
    fields: [emailLogs.orderId],
    references: [orders.id],
  }),
}))

export const discountCodesRelations = relations(discountCodes, ({ one }) => ({
  merchant: one(merchants, {
    fields: [discountCodes.merchantId],
    references: [merchants.id],
  }),
}))

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(subscriptions),
  subscriptionPayments: many(subscriptionPayments),
}))

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  merchant: one(merchants, {
    fields: [subscriptions.merchantId],
    references: [merchants.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}))

export const subscriptionPaymentsRelations = relations(subscriptionPayments, ({ one }) => ({
  merchant: one(merchants, {
    fields: [subscriptionPayments.merchantId],
    references: [merchants.id],
  }),
  recordedByUser: one(user, {
    fields: [subscriptionPayments.recordedBy],
    references: [user.id],
  }),
  targetPlan: one(subscriptionPlans, {
    fields: [subscriptionPayments.targetPlanId],
    references: [subscriptionPlans.id],
  }),
}))

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  twoFactors: many(twoFactor),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, {
    fields: [twoFactor.userId],
    references: [user.id],
  }),
}))

export const notificationQueueRelations = relations(notificationQueue, ({ one }) => ({
  merchant: one(merchants, {
    fields: [notificationQueue.merchantId],
    references: [merchants.id],
  }),
}))

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  merchant: one(merchants, {
    fields: [notificationPreferences.merchantId],
    references: [merchants.id],
  }),
}))
