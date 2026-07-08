CREATE TABLE "pages" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pages" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "theme_settings" jsonb;
--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "pages_merchant_id_idx" ON "pages" USING btree ("merchant_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "pages_merchant_slug_idx" ON "pages" USING btree ("merchant_id","slug");