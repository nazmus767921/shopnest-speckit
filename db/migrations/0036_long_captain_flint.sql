CREATE TABLE "customer_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"author_id" text,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "flash_sales" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text,
	"sale_price_paisa" integer NOT NULL,
	"limit_quantity" integer NOT NULL,
	"sold_quantity" integer DEFAULT 0 NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flash_sales" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "merchants" ALTER COLUMN "template" SET DEFAULT 'elegance';--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "two_factor" ADD COLUMN "failed_verification_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "two_factor" ADD COLUMN "locked_until" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phoneNumber" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phoneNumberVerified" boolean;--> statement-breakpoint
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_customer_id_user_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flash_sales" ADD CONSTRAINT "flash_sales_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flash_sales" ADD CONSTRAINT "flash_sales_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flash_sales" ADD CONSTRAINT "flash_sales_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_notes_customer_id_idx" ON "customer_notes" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_notes_merchant_id_idx" ON "customer_notes" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "flash_sales_merchant_id_idx" ON "flash_sales" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "flash_sales_product_id_idx" ON "flash_sales" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "flash_sales_variant_id_idx" ON "flash_sales" USING btree ("variant_id");