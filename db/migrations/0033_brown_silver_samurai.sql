CREATE TABLE "media_files" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"url" text NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"size" integer NOT NULL,
	"type" text NOT NULL,
	"folder" text DEFAULT 'general' NOT NULL,
	"uploaded_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "media_files_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "media_files" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "media_folders" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media_folders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_uploaded_by_id_user_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_files_merchant_id_idx" ON "media_files" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "media_files_folder_idx" ON "media_files" USING btree ("folder");--> statement-breakpoint
CREATE INDEX "media_folders_merchant_id_idx" ON "media_folders" USING btree ("merchant_id");