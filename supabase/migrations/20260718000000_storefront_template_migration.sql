-- T062: rename about -> brand_story
UPDATE storefront_sections SET section_key = 'brand_story' WHERE section_key = 'about';

-- T063: rename product_grid_featured -> featured_products, delete product_grid_new_arrivals/product_grid_exclusive
UPDATE storefront_sections SET section_key = 'featured_products' WHERE section_key = 'product_grid_featured';
DELETE FROM storefront_sections WHERE section_key IN ('product_grid_new_arrivals', 'product_grid_exclusive');

-- T064: update merchants.template
UPDATE merchants SET template = 'elegance' WHERE template IN ('general', 'fashion', 'retail');

-- T066: seed promo_banner, testimonials, newsletter (hidden) for existing merchants missing them
DO $$
DECLARE
    m RECORD;
BEGIN
    FOR m IN SELECT id FROM merchants LOOP
        -- check and insert promo_banner
        IF NOT EXISTS (SELECT 1 FROM storefront_sections WHERE merchant_id = m.id AND section_key = 'promo_banner') THEN
            INSERT INTO storefront_sections (id, merchant_id, section_key, content, sort_order, is_visible, created_at, updated_at)
            VALUES (gen_random_uuid(), m.id, 'promo_banner', '{}', 0, false, NOW(), NOW());
        END IF;

        -- check and insert testimonials
        IF NOT EXISTS (SELECT 1 FROM storefront_sections WHERE merchant_id = m.id AND section_key = 'testimonials') THEN
            INSERT INTO storefront_sections (id, merchant_id, section_key, content, sort_order, is_visible, created_at, updated_at)
            VALUES (gen_random_uuid(), m.id, 'testimonials', '{}', 0, false, NOW(), NOW());
        END IF;

        -- check and insert newsletter
        IF NOT EXISTS (SELECT 1 FROM storefront_sections WHERE merchant_id = m.id AND section_key = 'newsletter') THEN
            INSERT INTO storefront_sections (id, merchant_id, section_key, content, sort_order, is_visible, created_at, updated_at)
            VALUES (gen_random_uuid(), m.id, 'newsletter', '{}', 0, false, NOW(), NOW());
        END IF;
    END LOOP;
END $$;
-- T065: update store_templates
DELETE FROM store_templates WHERE slug IN ('general', 'retail');
UPDATE store_templates SET slug = 'elegance', name = 'Elegance' WHERE slug = 'fashion';
