CREATE TABLE "notification_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"event_type" text NOT NULL,
	"channel" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_preferences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notification_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"channel" text DEFAULT 'telegram' NOT NULL,
	"recipient" text NOT NULL,
	"message_payload" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_queue" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "telegram_chat_id" text;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_preferences_merchant_event_channel_unique" ON "notification_preferences" USING btree ("merchant_id","event_type","channel");--> statement-breakpoint
CREATE INDEX "notification_queue_status_created_at_idx" ON "notification_queue" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "notification_queue_merchant_id_idx" ON "notification_queue" USING btree ("merchant_id");