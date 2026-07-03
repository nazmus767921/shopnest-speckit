CREATE TABLE "delivery_zones" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"division" text NOT NULL,
	"district" text NOT NULL,
	"delivery_charge_paisa" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "delivery_zones" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_charge_paisa" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_zones" ADD CONSTRAINT "delivery_zones_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "delivery_zones_merchant_id_idx" ON "delivery_zones" USING btree ("merchant_id");