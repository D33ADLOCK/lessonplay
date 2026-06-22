ALTER TABLE "chats" ADD COLUMN "source_snapshot_id" text;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "source_manifest_key" text;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "source_manifest_url" text;--> statement-breakpoint
ALTER TABLE "game_versions" ADD COLUMN "source_snapshot_id" text;--> statement-breakpoint
ALTER TABLE "game_versions" ADD COLUMN "source_manifest_key" text;--> statement-breakpoint
ALTER TABLE "game_versions" ADD COLUMN "source_manifest_url" text;