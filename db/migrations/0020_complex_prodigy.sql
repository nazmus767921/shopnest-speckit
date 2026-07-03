ALTER TABLE "email_logs" DROP CONSTRAINT "email_logs_order_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "email_logs" ALTER COLUMN "order_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "snapshot_product_limit" integer;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "snapshot_category_limit" integer;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "snapshot_discount_limit" integer;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "snapshot_images_per_product" integer;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "snapshot_image_size_mb" integer;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "snapshot_orders_per_month" integer;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
UPDATE subscriptions
SET
  snapshot_product_limit      = (sp.features->>'max_products')::integer,
  snapshot_category_limit     = (sp.features->>'max_categories')::integer,
  snapshot_discount_limit     = CASE
    WHEN (sp.features->>'discount_codes')::boolean = true THEN null
    ELSE 0
  END,
  snapshot_images_per_product = (sp.features->>'max_images_per_product')::integer,
  snapshot_image_size_mb      = (sp.features->>'image_size_limit_mb')::integer,
  snapshot_orders_per_month   = (sp.features->>'max_orders_per_month')::integer
FROM subscription_plans sp
WHERE sp.id = subscriptions.plan_id OR (subscriptions.plan_id IS NULL AND sp.slug = subscriptions.plan);