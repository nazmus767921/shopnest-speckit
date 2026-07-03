ALTER TABLE "merchants" ALTER COLUMN "social_links" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "merchants" ALTER COLUMN "custom_faqs" SET DATA TYPE jsonb;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "verification_identifier_value_idx" ON "verification" USING btree ("identifier","value");