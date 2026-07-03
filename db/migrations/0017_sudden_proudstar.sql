ALTER TABLE "merchants" ALTER COLUMN "social_links" SET DATA TYPE jsonb USING "social_links"::jsonb;--> statement-breakpoint
ALTER TABLE "merchants" ALTER COLUMN "custom_faqs" SET DATA TYPE jsonb USING "custom_faqs"::jsonb;--> statement-breakpoint
CREATE INDEX "discount_codes_merchant_id_idx" ON "discount_codes" USING btree ("merchant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "discount_codes_merchant_code_unique_idx" ON "discount_codes" USING btree ("merchant_id","code");--> statement-breakpoint
CREATE INDEX "email_logs_order_id_idx" ON "email_logs" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "merchants_owner_id_idx" ON "merchants" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "merchants_subscription_status_idx" ON "merchants" USING btree ("subscription_status");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_merchant_id_idx" ON "order_items" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "order_items_product_id_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "orders_merchant_id_idx" ON "orders" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "orders_merchant_created_at_idx" ON "orders" USING btree ("merchant_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_merchant_status_idx" ON "orders" USING btree ("merchant_id","status");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_guest_phone_idx" ON "orders" USING btree ("guest_phone");--> statement-breakpoint
CREATE INDEX "payment_confirmations_order_id_idx" ON "payment_confirmations" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payment_confirmations_merchant_id_idx" ON "payment_confirmations" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "product_images_product_id_idx" ON "product_images" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_images_merchant_id_idx" ON "product_images" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "products_merchant_id_idx" ON "products" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "products_merchant_published_deleted_idx" ON "products" USING btree ("merchant_id","is_published","deleted_at");--> statement-breakpoint
CREATE INDEX "products_merchant_created_at_idx" ON "products" USING btree ("merchant_id","created_at");--> statement-breakpoint
CREATE INDEX "products_slug_merchant_idx" ON "products" USING btree ("slug","merchant_id");--> statement-breakpoint
CREATE INDEX "products_category_id_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "subscription_payments_merchant_id_idx" ON "subscription_payments" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "subscription_payments_status_idx" ON "subscription_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_merchant_id_idx" ON "subscriptions" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");