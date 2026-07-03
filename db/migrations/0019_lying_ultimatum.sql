CREATE TABLE "subscription_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"price_paisa" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"features" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "subscription_plans" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscription_payments" ADD COLUMN "target_plan_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "plan_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_plans_slug_unique_idx" ON "subscription_plans" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "subscription_plans_is_archived_idx" ON "subscription_plans" USING btree ("is_archived");--> statement-breakpoint
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_target_plan_id_subscription_plans_id_fk" FOREIGN KEY ("target_plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
INSERT INTO subscription_plans (id, name, slug, price_paisa, is_active, is_archived, features, created_at, updated_at)
VALUES
  (
    '45d5a7d6-3d2b-4d40-85bc-23df7a6b7ee1', 'Starter', 'starter', 49900, true, false,
    '{"max_products":50,"max_orders_per_month":200,"max_categories":5,
      "max_variants_per_product":10,
      "max_images_per_product":2,"image_size_limit_mb":1,
      "discount_codes":false,"telegram_notifications":true,"cod":true}',
    now(), now()
  ),
  (
    '8c3b7f58-5f5f-4a33-8a39-389d0b8f0472', 'Growth', 'growth', 99900, true, false,
    '{"max_products":100,"max_orders_per_month":500,"max_categories":15,
      "max_variants_per_product":30,
      "max_images_per_product":5,"image_size_limit_mb":2,
      "discount_codes":true,"telegram_notifications":true,"cod":true}',
    now(), now()
  ),
  (
    'd1c4f526-bd8e-4a6c-9a1b-3f2d0f5e6a8b', 'Pro', 'pro', 149900, true, false,
    '{"max_products":null,"max_orders_per_month":null,"max_categories":null,
      "max_variants_per_product":null,
      "max_images_per_product":5,"image_size_limit_mb":2,
      "discount_codes":true,"telegram_notifications":true,"cod":true}',
    now(), now()
  );--> statement-breakpoint
UPDATE subscriptions s
SET plan_id = sp.id
FROM subscription_plans sp
WHERE sp.slug = s.plan;--> statement-breakpoint
UPDATE subscription_payments sp_pay
SET target_plan_id = sp_plan.id
FROM subscription_plans sp_plan
WHERE sp_plan.slug = sp_pay.target_plan;