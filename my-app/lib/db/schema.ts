import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const chats = pgTable(
  "chats",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    clerk_user_id: varchar("clerk_user_id", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }),
    latest_html: text("latest_html"),
    demo_url: text("demo_url"),
    source_snapshot_id: text("source_snapshot_id"),
    source_manifest_key: text("source_manifest_key"),
    source_manifest_url: text("source_manifest_url"),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    clerkUserIdIdx: index("chats_clerk_user_id_idx").on(table.clerk_user_id),
    updatedAtIdx: index("chats_updated_at_idx").on(table.updated_at),
  }),
);

export type Chat = InferSelectModel<typeof chats>;
export type NewChat = InferInsertModel<typeof chats>;

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    chat_id: uuid("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 32 }).notNull(),
    content: jsonb("content").notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    chatIdIdx: index("messages_chat_id_idx").on(table.chat_id),
    createdAtIdx: index("messages_created_at_idx").on(table.created_at),
  }),
);

export type Message = InferSelectModel<typeof messages>;
export type NewMessage = InferInsertModel<typeof messages>;

export const game_versions = pgTable(
  "game_versions",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    chat_id: uuid("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    html: text("html").notNull(),
    demo_url: text("demo_url"),
    source_snapshot_id: text("source_snapshot_id"),
    source_manifest_key: text("source_manifest_key"),
    source_manifest_url: text("source_manifest_url"),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    chatIdIdx: index("game_versions_chat_id_idx").on(table.chat_id),
    createdAtIdx: index("game_versions_created_at_idx").on(table.created_at),
  }),
);

export type GameVersion = InferSelectModel<typeof game_versions>;
export type NewGameVersion = InferInsertModel<typeof game_versions>;

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  clerk_user_id: varchar("clerk_user_id", { length: 255 }).notNull(),
  chat_id: uuid("chat_id").references(() => chats.id, { onDelete: "cascade" }),

  object_key: text("object_key").notNull(),
  original_name: text("original_name").notNull(),
  content_type: varchar("content_type", { length: 255 }).notNull(),
  size_bytes: integer("size_bytes").notNull(),

  status: varchar("status", { length: 32 }).notNull().default("pending"),

  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Attachment = InferSelectModel<typeof attachments>;
export type NewAttachment = InferInsertModel<typeof attachments>;
