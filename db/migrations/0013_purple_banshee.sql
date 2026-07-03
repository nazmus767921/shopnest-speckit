DROP TABLE "delivery_zones" CASCADE;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "fallback_delivery_charge_paisa" integer DEFAULT 0 NOT NULL;