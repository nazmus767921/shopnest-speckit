CREATE TABLE "store_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"preview_image_url" text,
	"business_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allowed_tiers" jsonb DEFAULT '["starter","growth","pro"]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "store_templates" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "merchants" RENAME COLUMN "theme" TO "template";
--> statement-breakpoint
ALTER TABLE "merchants" ALTER COLUMN "template" SET DEFAULT 'general';
--> statement-breakpoint
UPDATE "merchants" SET "template" = 'general' WHERE "template" = 'default' OR "template" = 'cinematic';
--> statement-breakpoint
INSERT INTO "store_templates" ("id", "slug", "name", "description", "business_types", "allowed_tiers", "is_active", "is_default", "sort_order") VALUES
('general', 'general', 'General Store', 'A versatile and clean storefront layout suitable for any category.', '["general","electronics","beauty","food"]'::jsonb, '["starter","growth","pro"]'::jsonb, true, true, 0),
('fashion', 'fashion', 'Fashion Boutique', 'An editorial lookbook storefront layout designed for apparel.', '["clothing","accessories","shoes"]'::jsonb, '["growth","pro"]'::jsonb, true, false, 1);