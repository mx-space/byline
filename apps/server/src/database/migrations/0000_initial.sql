CREATE TABLE "ai_agent_conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"model" text,
	"provider_id" text,
	"title" text,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ai_generation_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"ref_id" text NOT NULL,
	"lang" text,
	"task_id" text,
	"provider_id" text,
	"model" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"cache_read_tokens" integer,
	"cache_write_tokens" integer,
	"total_tokens" integer,
	"cost_input_usd" double precision,
	"cost_output_usd" double precision,
	"cost_cache_read_usd" double precision,
	"cost_cache_write_usd" double precision,
	"cost_total_usd" double precision
);
--> statement-breakpoint
CREATE TABLE "ai_insights" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ref_id" text NOT NULL,
	"lang" text NOT NULL,
	"hash" text NOT NULL,
	"content" text NOT NULL,
	"is_translation" boolean DEFAULT false NOT NULL,
	"source_insights_id" text,
	"source_lang" text,
	"model_info" jsonb
);
--> statement-breakpoint
CREATE TABLE "ai_summaries" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"hash" text NOT NULL,
	"summary" text NOT NULL,
	"ref_id" text NOT NULL,
	"lang" text,
	"is_translation" boolean DEFAULT false NOT NULL,
	"source_summary_id" text,
	"source_lang" text
);
--> statement-breakpoint
CREATE TABLE "ai_translations" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"hash" text NOT NULL,
	"ref_id" text NOT NULL,
	"ref_type" text NOT NULL,
	"lang" text NOT NULL,
	"source_lang" text NOT NULL,
	"title" text NOT NULL,
	"text" text NOT NULL,
	"subtitle" text,
	"summary" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"source_modified_at" timestamp with time zone,
	"ai_model" text,
	"ai_provider" text,
	"content_format" text,
	"content" text,
	"source_block_snapshots" jsonb,
	"source_meta_hashes" jsonb
);
--> statement-breakpoint
CREATE TABLE "ai_tts" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"ref_id" text NOT NULL,
	"lang" text NOT NULL,
	"is_translation" boolean DEFAULT false NOT NULL,
	"source_lang" text,
	"model" text NOT NULL,
	"voice" text NOT NULL,
	"speed" real DEFAULT 1 NOT NULL,
	"format" text DEFAULT 'mp3' NOT NULL,
	"block_order" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"char_count" integer DEFAULT 0 NOT NULL,
	"total_duration_ms" integer,
	"source_modified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ai_tts_blocks" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"tts_id" text NOT NULL,
	"block_id" text NOT NULL,
	"fingerprint" text NOT NULL,
	"chunk_index" integer DEFAULT 0 NOT NULL,
	"text" text NOT NULL,
	"url" text NOT NULL,
	"storage_backend" text NOT NULL,
	"storage_key" text NOT NULL,
	"byte_size" integer,
	"duration_ms" integer
);
--> statement-breakpoint
CREATE TABLE "translation_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"key_path" text NOT NULL,
	"lang" text NOT NULL,
	"key_type" text NOT NULL,
	"lookup_key" text NOT NULL,
	"source_text" text NOT NULL,
	"translated_text" text NOT NULL,
	"source_updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"user_id" text NOT NULL,
	"account_id" text,
	"provider_id" text NOT NULL,
	"provider_account_id" text,
	"password" text,
	"type" text,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"id_token" text,
	"raw" jsonb
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"user_id" text,
	"reference_id" text,
	"config_id" text,
	"name" text,
	"key" text NOT NULL,
	"start" text,
	"prefix" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"rate_limit_enabled" boolean DEFAULT false NOT NULL,
	"rate_limit_time_window" integer,
	"rate_limit_max" integer,
	"request_count" integer DEFAULT 0 NOT NULL,
	"remaining" integer,
	"refill_interval" integer,
	"refill_amount" integer,
	"expires_at" timestamp with time zone,
	"last_refill_at" timestamp with time zone,
	"last_request" timestamp with time zone,
	"permissions" jsonb,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "device_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"device_code" text NOT NULL,
	"user_code" text NOT NULL,
	"user_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"status" text NOT NULL,
	"last_polled_at" timestamp with time zone,
	"polling_interval" integer,
	"client_id" text,
	"scope" text
);
--> statement-breakpoint
CREATE TABLE "passkeys" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"user_id" text NOT NULL,
	"name" text,
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"device_type" text,
	"backed_up" boolean DEFAULT false NOT NULL,
	"transports" text,
	"aaguid" text
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone,
	"ip_address" text,
	"user_agent" text,
	"provider" text
);
--> statement-breakpoint
CREATE TABLE "user_invites" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"token_hash" text NOT NULL,
	"invited_by" text,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_user_id" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"email" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"name" text,
	"handle" text,
	"username" text,
	"display_username" text,
	"image" text,
	"bio" text,
	"url" text,
	"permissions" integer DEFAULT 2147483647 NOT NULL,
	"is_profile_only" boolean DEFAULT false NOT NULL,
	"deactivated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_document_shares" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"token" text NOT NULL,
	"mode" text NOT NULL,
	"revision_id" text,
	"draft_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "content_document_shares_document_uniq" UNIQUE("document_id"),
	CONSTRAINT "content_document_shares_token_uniq" UNIQUE("token"),
	CONSTRAINT "content_document_shares_target_check" CHECK (("content_document_shares"."mode" = 'pinned' and "content_document_shares"."revision_id" is not null and "content_document_shares"."draft_id" is null)
        or ("content_document_shares"."mode" = 'follow' and "content_document_shares"."draft_id" is not null and "content_document_shares"."revision_id" is null))
);
--> statement-breakpoint
CREATE TABLE "content_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"ref_type" text NOT NULL,
	"ref_id" text,
	"published_revision_id" text,
	"publish_ai_resources" jsonb
);
--> statement-breakpoint
CREATE TABLE "content_publication_events" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"revision_id" text NOT NULL,
	"previous_revision_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"parent_revision_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"content" text,
	"content_format" text NOT NULL,
	"images" jsonb,
	"meta" jsonb,
	"type_specific_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "drafts" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"base_revision_id" text NOT NULL,
	"head_revision_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "drafts_status_check" CHECK ("drafts"."status" in ('active', 'archived'))
);
--> statement-breakpoint
CREATE TABLE "post_related_posts" (
	"post_id" text NOT NULL,
	"related_post_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"text" text,
	"content" text,
	"content_format" text NOT NULL,
	"summary" text,
	"images" jsonb,
	"meta" jsonb,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"modified_at" timestamp with time zone,
	"category_id" text NOT NULL,
	"copyright" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"read_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"pin_at" timestamp with time zone,
	"pin_order" integer
);
--> statement-breakpoint
CREATE TABLE "_app_migrations" (
	"id" text PRIMARY KEY NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"duration_ms" integer
);
--> statement-breakpoint
CREATE TABLE "file_references" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"status" text NOT NULL,
	"ref_id" text,
	"ref_type" text,
	"s3_object_key" text,
	"reader_id" text,
	"uploaded_by" text,
	"mime_type" text,
	"byte_size" bigint,
	"detached_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "file_usages" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"file_reference_id" text NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"source_field" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "options" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"value" jsonb
);
--> statement-breakpoint
CREATE TABLE "slug_trackers" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"type" text NOT NULL,
	"target_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"timestamp" timestamp with time zone,
	"headers" jsonb,
	"payload" jsonb,
	"event" text,
	"response" jsonb,
	"success" boolean,
	"hook_id" text NOT NULL,
	"status" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" text PRIMARY KEY NOT NULL,
	"timestamp" timestamp with time zone,
	"payload_url" text NOT NULL,
	"events" text[] NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"secret" text NOT NULL,
	"scope" integer
);
--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_source_insights_id_ai_insights_id_fk" FOREIGN KEY ("source_insights_id") REFERENCES "public"."ai_insights"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_summaries" ADD CONSTRAINT "ai_summaries_source_summary_id_ai_summaries_id_fk" FOREIGN KEY ("source_summary_id") REFERENCES "public"."ai_summaries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_tts_blocks" ADD CONSTRAINT "ai_tts_blocks_tts_id_ai_tts_id_fk" FOREIGN KEY ("tts_id") REFERENCES "public"."ai_tts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_reference_id_users_id_fk" FOREIGN KEY ("reference_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_codes" ADD CONSTRAINT "device_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkeys" ADD CONSTRAINT "passkeys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invites" ADD CONSTRAINT "user_invites_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invites" ADD CONSTRAINT "user_invites_accepted_user_id_users_id_fk" FOREIGN KEY ("accepted_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_document_shares" ADD CONSTRAINT "content_document_shares_document_id_content_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."content_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_document_shares" ADD CONSTRAINT "content_document_shares_revision_id_content_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."content_revisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_document_shares" ADD CONSTRAINT "content_document_shares_draft_id_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_documents" ADD CONSTRAINT "content_documents_published_revision_id_content_revisions_id_fk" FOREIGN KEY ("published_revision_id") REFERENCES "public"."content_revisions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_publication_events" ADD CONSTRAINT "content_publication_events_document_id_content_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."content_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_publication_events" ADD CONSTRAINT "content_publication_events_revision_id_content_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."content_revisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_publication_events" ADD CONSTRAINT "content_publication_events_previous_revision_id_content_revisions_id_fk" FOREIGN KEY ("previous_revision_id") REFERENCES "public"."content_revisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_document_id_content_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."content_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_parent_revision_id_content_revisions_id_fk" FOREIGN KEY ("parent_revision_id") REFERENCES "public"."content_revisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_document_id_content_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."content_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_base_revision_id_content_revisions_id_fk" FOREIGN KEY ("base_revision_id") REFERENCES "public"."content_revisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_head_revision_id_content_revisions_id_fk" FOREIGN KEY ("head_revision_id") REFERENCES "public"."content_revisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_related_posts" ADD CONSTRAINT "post_related_posts_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_related_posts" ADD CONSTRAINT "post_related_posts_related_post_id_posts_id_fk" FOREIGN KEY ("related_post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_references" ADD CONSTRAINT "file_references_reader_id_users_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_usages" ADD CONSTRAINT "file_usages_file_reference_id_file_references_id_fk" FOREIGN KEY ("file_reference_id") REFERENCES "public"."file_references"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_hook_id_webhooks_id_fk" FOREIGN KEY ("hook_id") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_agent_conversation_session_idx" ON "ai_agent_conversations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "ai_generation_metrics_resource_idx" ON "ai_generation_metrics" USING btree ("resource_type","resource_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_generation_metrics_ref_id_idx" ON "ai_generation_metrics" USING btree ("ref_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_insights_ref_lang_uniq" ON "ai_insights" USING btree ("ref_id","lang");--> statement-breakpoint
CREATE INDEX "ai_summaries_ref_id_idx" ON "ai_summaries" USING btree ("ref_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_summaries_ref_lang_uniq" ON "ai_summaries" USING btree ("ref_id","lang");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_translations_ref_lang_uniq" ON "ai_translations" USING btree ("ref_id","ref_type","lang");--> statement-breakpoint
CREATE INDEX "ai_translations_ref_id_idx" ON "ai_translations" USING btree ("ref_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_tts_ref_lang_uniq" ON "ai_tts" USING btree ("ref_id","lang");--> statement-breakpoint
CREATE INDEX "ai_tts_ref_id_idx" ON "ai_tts" USING btree ("ref_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_tts_blocks_key_uniq" ON "ai_tts_blocks" USING btree ("tts_id","block_id","chunk_index");--> statement-breakpoint
CREATE INDEX "ai_tts_blocks_tts_id_idx" ON "ai_tts_blocks" USING btree ("tts_id");--> statement-breakpoint
CREATE UNIQUE INDEX "translation_entries_key_uniq" ON "translation_entries" USING btree ("key_path","lang","key_type","lookup_key");--> statement-breakpoint
CREATE INDEX "translation_entries_path_lang_idx" ON "translation_entries" USING btree ("key_path","lang");--> statement-breakpoint
CREATE INDEX "translation_entries_lookup_key_idx" ON "translation_entries" USING btree ("lookup_key");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_uniq" ON "accounts" USING btree ("provider_id","provider_account_id");--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_key_uniq" ON "api_keys" USING btree ("key");--> statement-breakpoint
CREATE INDEX "api_keys_user_id_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "device_codes_device_code_uniq" ON "device_codes" USING btree ("device_code");--> statement-breakpoint
CREATE UNIQUE INDEX "device_codes_user_code_uniq" ON "device_codes" USING btree ("user_code");--> statement-breakpoint
CREATE INDEX "device_codes_expires_at_idx" ON "device_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "passkeys_credential_id_uniq" ON "passkeys" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "passkeys_user_id_idx" ON "passkeys" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_uniq" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_invites_token_hash_uniq" ON "user_invites" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "user_invites_email_idx" ON "user_invites" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uniq" ON "users" USING btree ("email") WHERE "users"."email" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_uniq" ON "users" USING btree ("username") WHERE "users"."username" is not null;--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_name_uniq" ON "categories" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_uniq" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "content_documents_ref_uniq" ON "content_documents" USING btree ("ref_type","ref_id") WHERE "content_documents"."ref_id" is not null;--> statement-breakpoint
CREATE INDEX "content_publication_events_document_idx" ON "content_publication_events" USING btree ("document_id","created_at");--> statement-breakpoint
CREATE INDEX "content_revisions_document_idx" ON "content_revisions" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "content_revisions_parent_idx" ON "content_revisions" USING btree ("parent_revision_id");--> statement-breakpoint
CREATE INDEX "drafts_document_status_idx" ON "drafts" USING btree ("document_id","status");--> statement-breakpoint
CREATE INDEX "drafts_updated_at_idx" ON "drafts" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "post_related_posts_pk" ON "post_related_posts" USING btree ("post_id","related_post_id");--> statement-breakpoint
CREATE INDEX "post_related_posts_related_idx" ON "post_related_posts" USING btree ("related_post_id");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_slug_uniq" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "posts_modified_at_idx" ON "posts" USING btree ("modified_at");--> statement-breakpoint
CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "posts_category_id_idx" ON "posts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX CONCURRENTLY "posts_published_created_at_idx" ON "posts" USING btree ("is_published","pin_at" DESC NULLS LAST,"created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX CONCURRENTLY "posts_category_published_created_idx" ON "posts" USING btree ("category_id","is_published","pin_at" DESC NULLS LAST,"created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX CONCURRENTLY "posts_tags_gin_idx" ON "posts" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "file_references_file_url_idx" ON "file_references" USING btree ("file_url");--> statement-breakpoint
CREATE INDEX "file_references_ref_idx" ON "file_references" USING btree ("ref_id","ref_type");--> statement-breakpoint
CREATE INDEX "file_references_status_created_idx" ON "file_references" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "file_references_reader_status_created_idx" ON "file_references" USING btree ("reader_id","status","created_at");--> statement-breakpoint
CREATE INDEX "file_references_status_detached_idx" ON "file_references" USING btree ("status","detached_at");--> statement-breakpoint
CREATE UNIQUE INDEX "file_usages_reference_source_uniq" ON "file_usages" USING btree ("file_reference_id","source_type","source_id","source_field");--> statement-breakpoint
CREATE INDEX "file_usages_source_idx" ON "file_usages" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "options_name_uniq" ON "options" USING btree ("name");--> statement-breakpoint
CREATE INDEX "slug_trackers_type_target_idx" ON "slug_trackers" USING btree ("type","target_id");--> statement-breakpoint
CREATE INDEX "slug_trackers_slug_type_idx" ON "slug_trackers" USING btree ("slug","type");--> statement-breakpoint
CREATE INDEX "webhook_events_hook_id_idx" ON "webhook_events" USING btree ("hook_id");--> statement-breakpoint
CREATE INDEX "webhook_events_timestamp_idx" ON "webhook_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "webhooks_enabled_idx" ON "webhooks" USING btree ("enabled");