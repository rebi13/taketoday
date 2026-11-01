import "server-only";
import { sql } from "drizzle-orm";
import {
  check,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { CHARACTER_NAME_MAX_LENGTH } from "@/shared/config/constants";
import { users } from "./auth";

// 캐릭터 종류는 시드로만 늘린다(기획서 9장). 사용자는 온보딩 S04에서 하나를 고른다.

export const characterTypes = pgTable("character_types", {
  id: text("id").primaryKey(), // seed: "dust-bunny", "cat", "hamster"
  name: text("name").notNull(),
  sortOrder: smallint("sort_order").notNull(),
  /** 에셋 제작 전에는 null */
  assetPath: text("asset_path"),
});

export const characters = pgTable(
  "characters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    characterTypeId: text("character_type_id")
      .notNull()
      .references(() => characterTypes.id),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // MVP는 사용자당 캐릭터 하나
    uniqueIndex("characters_user_unique").on(t.userId),
    check(
      "characters_name_length",
      sql`char_length(${t.name}) between 1 and ${sql.raw(String(CHARACTER_NAME_MAX_LENGTH))}`,
    ),
  ],
);
