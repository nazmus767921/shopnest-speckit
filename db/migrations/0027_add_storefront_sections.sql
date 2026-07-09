CREATE TABLE IF NOT EXISTS "storefront_sections" (
  "id" text PRIMARY KEY NOT NULL,
  "merchant_id" text NOT NULL,
  "section_key" text NOT NULL,
  "content" jsonb DEFAULT '{}' NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_visible" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "storefront_sections" ADD CONSTRAINT "storefront_sections_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "storefront_sections_merchant_id_idx" ON "storefront_sections" USING btree ("merchant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "storefront_sections_merchant_id_section_key_unique_idx" ON "storefront_sections" USING btree ("merchant_id", "section_key");

ALTER TABLE "storefront_sections" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON "storefront_sections"
AS PERMISSIVE FOR SELECT
TO public
USING (true);