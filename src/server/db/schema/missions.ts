import "server-only";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  CHECK_CRITERIA_MAX_LENGTH,
  MISSION_NAME_MAX_LENGTH,
} from "@/shared/config/constants";
import { users } from "./auth";

// 구역·기본 미션(시드 전용)과 사용자의 미션 리스트·미션 (기획서 8장·11장, 구현 계획 4장).
// 값의 종류는 seed/schema.ts와 같게 맞춘다.

export type { ConditionTag } from "@/shared/config/constants";
import type { ConditionTag } from "@/shared/config/constants";
export type Season = "spring" | "summer" | "autumn" | "winter";

export const difficulty = pgEnum("difficulty", ["low", "mid", "high"]);

/** 리스트 주인. MVP는 user만 만든다. group은 2단계 공유 리스트 대비(기획서 12.1) */
export const listOwnerType = pgEnum("list_owner_type", ["user", "group"]);

/** recurring = 주기형(cycle_days), once = 기한형(due_date) */
export const missionKind = pgEnum("mission_kind", ["recurring", "once"]);

export const missionCreator = pgEnum("mission_creator", ["user", "ai"]);

/** 공유 미션의 담당 방식(2단계). MVP에서는 비워 둔다 */
export const assignmentMode = pgEnum("assignment_mode", ["anyone", "assigned"]);

export const zones = pgTable("zones", {
  id: text("id").primaryKey(), // seed: "desk", "bathroom" …
  name: text("name").notNull(),
  icon: text("icon").notNull(), // lucide-react 아이콘 이름
  sortOrder: smallint("sort_order").notNull(),
  /** 조건 구역(반려동물·식물·차량)만 값이 있다 */
  conditionTag: text("condition_tag").$type<ConditionTag>(),
});

export const missionTemplates = pgTable("mission_templates", {
  id: text("id").primaryKey(), // seed: "desk-01" …
  zoneId: text("zone_id")
    .notNull()
    .references(() => zones.id),
  name: text("name").notNull(),
  checkCriteria: text("check_criteria").notNull(),
  cycleDays: integer("cycle_days").notNull(),
  estimatedMinutes: smallint("estimated_minutes").notNull(),
  difficulty: difficulty("difficulty").notNull(),
  conditionTags: text("condition_tags")
    .array()
    .$type<ConditionTag[]>()
    .notNull()
    .default(sql`'{}'::text[]`),
  /** 비어 있으면 계절 무관 */
  seasons: text("seasons")
    .array()
    .$type<Season[]>()
    .notNull()
    .default(sql`'{}'::text[]`),
  shareable: boolean("shareable").notNull(),
  defaultOn: boolean("default_on").notNull(),
  /** 이름·완료 기준이 바뀔 때마다 올린다. 사용자 미션에 반영할지 판단한다 */
  version: integer("version").notNull().default(1),
});

export const missionLists = pgTable(
  "mission_lists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerType: listOwnerType("owner_type").notNull(),
    // user 또는 group의 id. 주인 종류에 따라 가리키는 테이블이 달라 FK를 두지 않는다
    ownerId: uuid("owner_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("mission_lists_owner_unique").on(t.ownerType, t.ownerId)],
);

export const missions = pgTable(
  "missions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listId: uuid("list_id")
      .notNull()
      .references(() => missionLists.id),
    /** 기본 미션에서 켰으면 그 템플릿, 직접 만들었으면 null */
    templateId: text("template_id").references(() => missionTemplates.id),
    /** 마지막으로 반영한 템플릿 버전 */
    templateVersion: integer("template_version"),
    kind: missionKind("kind").notNull(),
    name: text("name").notNull(),
    zoneId: text("zone_id").references(() => zones.id),
    checkCriteria: text("check_criteria").notNull(),
    /** 사용자가 완료 기준을 고쳤다. 템플릿이 바뀌어도 덮어쓰지 않는다(기획서 8.2.1) */
    userModified: boolean("user_modified").notNull().default(false),
    cycleDays: integer("cycle_days"),
    dueDate: date("due_date", { mode: "string" }),
    createdBy: missionCreator("created_by").notNull().default("user"),
    assignmentMode: assignmentMode("assignment_mode"),
    assigneeId: uuid("assignee_id").references(() => users.id),
    /** 켜기·끄기 */
    active: boolean("active").notNull().default(true),
    /** 소프트 삭제. 기록과 정산 이력이 참조한다 */
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("missions_list_id_idx").on(t.listId),
    // 같은 리스트에서 기본 미션 하나는 한 번만 켠다(삭제한 것은 제외)
    uniqueIndex("missions_list_template_unique")
      .on(t.listId, t.templateId)
      .where(sql`${t.templateId} is not null and ${t.deletedAt} is null`),
    check(
      "missions_kind_fields",
      // CHECK는 결과가 NULL이면 통과시킨다. cycle_days가 NULL이면 "> 0"이 NULL이 되므로
      // is not null을 따로 적는다
      sql`(${t.kind} = 'recurring' and ${t.cycleDays} is not null and ${t.cycleDays} > 0 and ${t.dueDate} is null)
        or (${t.kind} = 'once' and ${t.dueDate} is not null and ${t.cycleDays} is null)`,
    ),
    // 입력 길이 제한(기획서 6.4). 화면·서비스에서 먼저 막고, DB는 마지막 안전장치
    check(
      "missions_name_length",
      sql`char_length(${t.name}) between 1 and ${sql.raw(String(MISSION_NAME_MAX_LENGTH))}`,
    ),
    check(
      "missions_check_criteria_length",
      sql`char_length(${t.checkCriteria}) between 1 and ${sql.raw(String(CHECK_CRITERIA_MAX_LENGTH))}`,
    ),
    check(
      "missions_template_version_pair",
      sql`(${t.templateId} is null) = (${t.templateVersion} is null)`,
    ),
  ],
);
