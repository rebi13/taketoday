import "server-only";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { missions } from "./missions";
import { dailySettlements } from "./wallet";

// 날짜별 미션과 완료 기록(기획서 6.7, 구현 계획 4장·5.2).
// 미션 자체와 "그날의 미션"을 나눠 날짜별로 남긴다. 날짜는 모두 서울 기준 localDate.

/** 상태 이름은 화면과 같게 쓴다(CLAUDE.md UI 규칙) */
export const dailyMissionStatus = pgEnum("daily_mission_status", [
  "pending",
  "done",
  "postponed",
  "canceled",
]);

/**
 * 그날의 추천을 만들었다는 표시. 추천이 0개인 날도 남겨 하루 동안 다시 만들지 않는다.
 * 같은 날 첫 요청이 동시에 와도 이 기본 키에서 한쪽만 만든다
 */
export const recommendationDays = pgTable(
  "recommendation_days",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    localDate: date("local_date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.localDate] })],
);

/**
 * 날짜별 미션. 추천받은 것(recommended)과 추천 밖에서 직접 한 것 모두 남는다.
 * 정산의 "미션 회차"는 미션 + 날짜다
 */
export const dailyMissions = pgTable(
  "daily_missions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id),
    localDate: date("local_date", { mode: "string" }).notNull(),
    status: dailyMissionStatus("status").notNull().default("pending"),
    /** 그날의 추천으로 들어왔다. 추천 밖에서 직접 하면 false */
    recommended: boolean("recommended").notNull(),
    /** 추천 순서(0부터). 추천 밖에서 직접 한 것은 null */
    recommendRank: smallint("recommend_rank"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("daily_missions_user_mission_date_unique").on(
      t.userId,
      t.missionId,
      t.localDate,
    ),
    index("daily_missions_user_date_idx").on(t.userId, t.localDate),
    check(
      "daily_missions_rank_matches_recommended",
      sql`${t.recommended} = (${t.recommendRank} is not null)`,
    ),
  ],
);

/**
 * 완료 기록. 보상은 다음 날 정산한다(ADR 0003): 완료할 때는 이것만 만들고 재화 거래는 만들지 않는다.
 * 취소는 지우지 않고 canceled_at을 채운다. 취소한 뒤 다시 하면 새 행이 생긴다
 */
export const completions = pgTable(
  "completions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dailyMissionId: uuid("daily_mission_id")
      .notNull()
      .references(() => dailyMissions.id),
    /** 수행한 사람. 공유 리스트(2단계)에서는 미션 주인과 다를 수 있다 */
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id),
    localDate: date("local_date", { mode: "string" }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    /** 이 완료를 보상으로 인정한 정산. 인정하지 않은 완료(취소·중복·상한 밖)는 null */
    settlementId: uuid("settlement_id").references(() => dailySettlements.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("completions_local_date_idx").on(t.localDate),
    index("completions_user_date_idx").on(t.userId, t.localDate),
    // 같은 날짜별 미션에 취소하지 않은 완료는 하나뿐(두 번 눌러도 한 번)
    uniqueIndex("completions_daily_mission_active_unique")
      .on(t.dailyMissionId)
      .where(sql`${t.canceledAt} is null`),
  ],
);
