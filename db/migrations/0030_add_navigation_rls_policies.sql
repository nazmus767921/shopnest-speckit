-- Add RLS policies for menus and menu_items tables
-- Follows the pattern from 0027_add_storefront_sections.sql

CREATE POLICY "Allow public read access" ON "menus"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

--> statement-breakpoint

CREATE POLICY "Allow public read access" ON "menu_items"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

--> statement-breakpoint

CREATE POLICY "Allow merchant write access" ON "menus"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  merchant_id IN (SELECT id FROM merchants WHERE owner_id = auth.uid())
);

--> statement-breakpoint

CREATE POLICY "Allow merchant update access" ON "menus"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  merchant_id IN (SELECT id FROM merchants WHERE owner_id = auth.uid())
)
WITH CHECK (
  merchant_id IN (SELECT id FROM merchants WHERE owner_id = auth.uid())
);

--> statement-breakpoint

CREATE POLICY "Allow merchant delete access" ON "menus"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  merchant_id IN (SELECT id FROM merchants WHERE owner_id = auth.uid())
);

--> statement-breakpoint

CREATE POLICY "Allow merchant write access" ON "menu_items"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  menu_id IN (
    SELECT m.id FROM menus m
    WHERE m.merchant_id IN (SELECT id FROM merchants WHERE owner_id = auth.uid())
  )
);

--> statement-breakpoint

CREATE POLICY "Allow merchant update access" ON "menu_items"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  menu_id IN (
    SELECT m.id FROM menus m
    WHERE m.merchant_id IN (SELECT id FROM merchants WHERE owner_id = auth.uid())
  )
)
WITH CHECK (
  menu_id IN (
    SELECT m.id FROM menus m
    WHERE m.merchant_id IN (SELECT id FROM merchants WHERE owner_id = auth.uid())
  )
);

--> statement-breakpoint

CREATE POLICY "Allow merchant delete access" ON "menu_items"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  menu_id IN (
    SELECT m.id FROM menus m
    WHERE m.merchant_id IN (SELECT id FROM merchants WHERE owner_id = auth.uid())
  )
);
