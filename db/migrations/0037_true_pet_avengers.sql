CREATE TABLE "merchant_themes" (
	"merchant_id" text PRIMARY KEY NOT NULL,
	"theme_id" text NOT NULL,
	"active_layout" jsonb DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "merchant_themes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "themes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"css_variables" jsonb DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "themes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "merchant_themes" ADD CONSTRAINT "merchant_themes_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_themes" ADD CONSTRAINT "merchant_themes_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE restrict ON UPDATE no action;