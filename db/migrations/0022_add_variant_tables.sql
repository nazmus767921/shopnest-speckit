CREATE TABLE "attribute_options" (
	"id" text PRIMARY KEY NOT NULL,
	"attribute_id" text NOT NULL,
	"label" text NOT NULL,
	"value" text NOT NULL,
	"swatch_color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attribute_options" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_attributes" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"product_id" text NOT NULL,
	"name" text NOT NULL,
	"display_type" text DEFAULT 'dropdown' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_attributes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_metadata" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"merchant_id" text NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_metadata" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"product_id" text NOT NULL,
	"sku" text NOT NULL,
	"price_paisa" integer,
	"stock_count" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_variants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "variant_attribute_links" (
	"id" text PRIMARY KEY NOT NULL,
	"variant_id" text NOT NULL,
	"attribute_option_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "variant_attribute_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "variant_images" (
	"id" text PRIMARY KEY NOT NULL,
	"variant_id" text NOT NULL,
	"merchant_id" text NOT NULL,
	"storage_path" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "variant_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "variant_id" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "variant_label" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "has_variants" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "variant_generation" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "metadata_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "attribute_options" ADD CONSTRAINT "attribute_options_attribute_id_product_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."product_attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_metadata" ADD CONSTRAINT "product_metadata_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_metadata" ADD CONSTRAINT "product_metadata_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_attribute_links" ADD CONSTRAINT "variant_attribute_links_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_attribute_links" ADD CONSTRAINT "variant_attribute_links_attribute_option_id_attribute_options_id_fk" FOREIGN KEY ("attribute_option_id") REFERENCES "public"."attribute_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_images" ADD CONSTRAINT "variant_images_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_images" ADD CONSTRAINT "variant_images_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_attribute_options_attribute" ON "attribute_options" USING btree ("attribute_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_attribute_options_attr_value" ON "attribute_options" USING btree ("attribute_id","value");--> statement-breakpoint
CREATE INDEX "idx_product_attributes_product" ON "product_attributes" USING btree ("product_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_product_attributes_merchant" ON "product_attributes" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "idx_product_metadata_product" ON "product_metadata" USING btree ("product_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_product_metadata_product_key" ON "product_metadata" USING btree ("product_id","key");--> statement-breakpoint
CREATE INDEX "idx_product_variants_product" ON "product_variants" USING btree ("product_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_product_variants_merchant" ON "product_variants" USING btree ("merchant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_product_variants_sku" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "idx_product_variants_active" ON "product_variants" USING btree ("product_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_variant_links_variant" ON "variant_attribute_links" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_variant_links_option" ON "variant_attribute_links" USING btree ("attribute_option_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_variant_links_variant_option" ON "variant_attribute_links" USING btree ("variant_id","attribute_option_id");--> statement-breakpoint
CREATE INDEX "idx_variant_images_variant" ON "variant_images" USING btree ("variant_id","display_order");