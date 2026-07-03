CREATE TABLE "email_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"recipient_email" text NOT NULL,
	"template" text NOT NULL,
	"order_id" text NOT NULL,
	"status" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;