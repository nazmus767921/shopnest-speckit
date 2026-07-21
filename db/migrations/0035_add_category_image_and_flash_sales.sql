ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "image_url" text;

CREATE TABLE IF NOT EXISTS "flash_sales" (
  "id" text PRIMARY KEY NOT NULL,
  "merchant_id" text NOT NULL,
  "product_id" text NOT NULL,
  "sale_price_paisa" integer NOT NULL,
  "limit_quantity" integer NOT NULL,
  "sold_quantity" integer DEFAULT 0 NOT NULL,
  "start_time" timestamp NOT NULL,
  "end_time" timestamp NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "flash_sales" ADD CONSTRAINT "flash_sales_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "flash_sales" ADD CONSTRAINT "flash_sales_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "flash_sales_merchant_id_idx" ON "flash_sales" USING btree ("merchant_id");
CREATE INDEX IF NOT EXISTS "flash_sales_product_id_idx" ON "flash_sales" USING btree ("product_id");

ALTER TABLE "flash_sales" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to active flash sales" ON "flash_sales"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow merchants full control of their own flash sales" ON "flash_sales"
AS PERMISSIVE FOR ALL
TO authenticated
USING (merchant_id = (SELECT id FROM merchants WHERE owner_id = auth.uid()))
WITH CHECK (merchant_id = (SELECT id FROM merchants WHERE owner_id = auth.uid()));
