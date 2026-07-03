ALTER TABLE "subscription_payments" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription_payments" ADD COLUMN "months" integer DEFAULT 1 NOT NULL;