-- Insert retail template
INSERT INTO "store_templates" ("id", "slug", "name", "description", "business_types", "allowed_tiers", "is_active", "is_default", "sort_order") VALUES
('retail', 'retail', 'Retail Storefront', 'A high-fidelity modern storefront layout showcasing categories, heroes, and flash sales.', '["general","clothing","electronics","beauty","food"]'::jsonb, '["growth","pro"]'::jsonb, true, false, 2)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "business_types" = EXCLUDED."business_types",
  "allowed_tiers" = EXCLUDED."allowed_tiers",
  "is_active" = EXCLUDED."is_active",
  "is_default" = EXCLUDED."is_default",
  "sort_order" = EXCLUDED."sort_order";

-- Set preview image URLs for general and fashion templates
UPDATE "store_templates" SET "preview_image_url" = '/images/templates/general-thumbnail.png' WHERE "id" = 'general';
UPDATE "store_templates" SET "preview_image_url" = '/images/templates/fashion-thumbnail.png' WHERE "id" = 'fashion';
