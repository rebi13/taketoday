import "server-only";
import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

// 정산과 재화(기획서 6.1·11.1, ADR 0003, 구현 계획 4장).
// 잔액은 wallet_transactions의 합계다. 따로 저장하는 값은 두지 않는다(필요해지면 캐시로만).

/**
 * 거래 사유(기획서 11장 WalletTransaction). MVP는 personal_reward와 purchase만 만든다.
 * shared_reward(공유 리스트)·gacha·gacha_refund·bonus_roulette는 2단계 대비로 미리 둔다
 */
export const walletReason = pgEnum("wallet_reason", [
  "personal_reward",
  "shared_reward",
  "purchase",
  "gacha",
  "gacha_refund",
  "bonus_roulette",
]);

/**
 * 하루 정산. (user_id, local_date) 유니크로 한 사람의 하루를 한 번만 정산한다.
 * 지연 정산(첫 요청)과 매일 작업(cron)이 같은 날을 함께 잡아도 한쪽만 들어간다.
 * 인정한 완료가 0개인 날도 남겨 다시 정산하지 않는다
 */
export const dailySettlements = pgTable(
  "daily_settlements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    localDate: date("local_date", { mode: "string" }).notNull(),
    /** 인정한 완료 수(상한까지) */
    rewardedCount: smallint("rewarded_count").notNull(),
    /** 지급액 = 인정한 완료 수 × 1회 보상 */
    amount: integer("amount").notNull(),
    settledAt: timestamp("settled_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** 사용자가 P09 "어제 보상 도착"으로 본 때. 매일 작업이 먼저 정산해도 다음 접속에 한 번 보여 준다 */
    seenAt: timestamp("seen_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("daily_settlements_user_date_unique").on(t.userId, t.localDate),
    check(
      "daily_settlements_amount_non_negative",
      sql`${t.amount} >= 0 and ${t.rewardedCount} >= 0`,
    ),
  ],
);

/** 재화 거래. 보상은 +, 구매는 − */
export const walletTransactions = pgTable(
  "wallet_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    amount: integer("amount").notNull(),
    reason: walletReason("reason").notNull(),
    /** 보상이면 정산 id, 구매면 인벤토리 id 등 */
    relatedId: uuid("related_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("wallet_transactions_user_idx").on(t.userId),
    check("wallet_transactions_amount_nonzero", sql`${t.amount} <> 0`),
    // 같은 정산으로 같은 사람에게 같은 사유의 보상을 두 번 주지 않는다(마지막 안전장치)
    uniqueIndex("wallet_transactions_reward_once")
      .on(t.userId, t.reason, t.relatedId)
      .where(
        sql`${t.reason} in ('personal_reward', 'shared_reward') and ${t.relatedId} is not null`,
      ),
  ],
);
