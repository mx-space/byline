ALTER TABLE "posts" ADD COLUMN "public_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "public_notified_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX CONCURRENTLY "posts_pending_public_idx" ON "posts" USING btree ("public_at") WHERE "posts"."is_published" = true and "posts"."public_at" is not null and "posts"."public_notified_at" is null;