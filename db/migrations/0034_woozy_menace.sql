CREATE TABLE "banned_ips" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"ip_address" text NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "banned_ips" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"merchant_id" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_addresses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_email_unique";--> statement-breakpoint
ALTER TABLE "media_files" ALTER COLUMN "folder" SET DEFAULT 'uncategorized';--> statement-breakpoint
ALTER TABLE "media_files" ADD COLUMN "is_starred" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "merchant_id" text;--> statement-breakpoint
ALTER TABLE "banned_ips" ADD CONSTRAINT "banned_ips_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "banned_ips_merchant_ip_idx" ON "banned_ips" USING btree ("merchant_id","ip_address");--> statement-breakpoint
CREATE INDEX "customer_addresses_user_merchant_idx" ON "customer_addresses" USING btree ("user_id","merchant_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_merchant_id_unique_idx" ON "user" USING btree ("email","merchant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_global_email_unique_idx" ON "user" USING btree ("email") WHERE "user"."merchant_id" IS NULL;