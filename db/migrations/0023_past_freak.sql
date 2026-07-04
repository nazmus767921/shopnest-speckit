ALTER TABLE "merchants" ADD COLUMN "cod_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "pay_delivery_charge_first" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "bkash_wallet_number" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "nagad_wallet_number" text;