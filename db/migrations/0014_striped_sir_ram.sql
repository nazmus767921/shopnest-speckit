CREATE TABLE "shipping_zone_districts" (
	"id" text PRIMARY KEY NOT NULL,
	"zone_id" text NOT NULL,
	"merchant_id" text NOT NULL,
	"division" text NOT NULL,
	"district" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shipping_zone_districts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "shipping_zones" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"name" text NOT NULL,
	"delivery_charge_paisa" integer DEFAULT 0 NOT NULL,
	"free_shipping_threshold_paisa" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shipping_zones" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "shipping_zone_districts" ADD CONSTRAINT "shipping_zone_districts_zone_id_shipping_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."shipping_zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_zone_districts" ADD CONSTRAINT "shipping_zone_districts_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_zones" ADD CONSTRAINT "shipping_zones_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "shipping_zone_districts_zone_district_unique_idx" ON "shipping_zone_districts" USING btree ("zone_id","district");--> statement-breakpoint
CREATE INDEX "shipping_zone_districts_merchant_id_idx" ON "shipping_zone_districts" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "shipping_zones_merchant_id_idx" ON "shipping_zones" USING btree ("merchant_id");