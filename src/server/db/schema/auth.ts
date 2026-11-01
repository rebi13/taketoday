import "server-only";
import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  DAILY_PERSONAL_REWARD_CAP,
  DEFAULT_DAILY_RECOMMEND_COUNT,
  SERVICE_TIME_ZONE,
} from "@/shared/config/constants";
import type { ConditionTag } from "./missions";

// users·accounts·sessions는 Auth.js Drizzle adapter가 쓰는 테이블이다(구현 계획 4장).
// 구글에서 받는 정보는 이메일만 저장한다(기획서 17.2). name·image는 adapter가
// 요구해서 컬럼만 두고, server/auth에서 항상 null로 넣는다. 닉네임은 온보딩에서 받는다.

/** 탈퇴하면 즉시 deactivated, 통계는 active만 센다(기획서 17.3) */
export const userStatus = pgEnum("user_status", ["active", "deactivated"]);

/** 온보딩의 거주 형태(기획서 8.6) */
export const household = pgEnum("household", ["solo", "shared"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").unique(),
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    name: text("name"),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    // ── 서비스 필드 ──
    nickname: text("nickname"),
    status: userStatus("status").notNull().default("active"),
    deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
    // 하루는 서비스 전체가 서울 기준이다. 사용자별 시간대는 나중을 위해 자리만 둔다
    timezone: text("timezone").notNull().default(SERVICE_TIME_ZONE),
    household: household("household"),
    conditionTags: text("condition_tags")
      .array()
      .$type<ConditionTag[]>()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** 기본 알림 시각(서울 기준). 온보딩 S07에서 정한다 */
    notifyTime: time("notify_time"),
    dailyRecommendCount: smallint("daily_recommend_count")
      .notNull()
      .default(DEFAULT_DAILY_RECOMMEND_COUNT),
    /** QStash에 예약해 둔 다음 기본 알림 메시지. 시간 변경 시 취소한다 */
    scheduledNotifyMessageId: text("scheduled_notify_message_id"),
    termsAgreedAt: timestamp("terms_agreed_at", { withTimezone: true }),
    /** 동의한 약관 버전(shared/config TERMS_VERSION) */
    termsVersion: text("terms_version"),
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  },
  (t) => [
    // 보상은 하루 상한까지만 인정되므로 그보다 많이 추천할 이유가 없다
    check(
      "users_daily_recommend_count_range",
      sql`${t.dailyRecommendCount} between 1 and ${sql.raw(String(DAILY_PERSONAL_REWARD_CAP))}`,
    ),
    check(
      "users_terms_agreed_pair",
      sql`(${t.termsAgreedAt} is null) = (${t.termsVersion} is null)`,
    ),
    check(
      "users_deactivated_at_matches_status",
      sql`(${t.status} = 'deactivated') = (${t.deactivatedAt} is not null)`,
    ),
  ],
);

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type")
      .$type<"oauth" | "oidc" | "email" | "webauthn">()
      .notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    // OAuth 토큰은 쓰지 않아 저장하지 않는다. adapter가 요구해서 컬럼만 둔다.
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

/** 쉬는 날. 그날은 알림을 보내지 않는다(기획서 6.9). 0 = 일요일 */
export const userRestDays = pgTable(
  "user_rest_days",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weekday: smallint("weekday").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.weekday] }),
    check("user_rest_days_weekday_range", sql`${t.weekday} between 0 and 6`),
  ],
);
