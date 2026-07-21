ALTER TABLE "flash_sales" ADD COLUMN "variant_id" text REFERENCES "product_variants" ("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "flash_sales_variant_id_idx" ON "flash_sales" ("variant_id");
