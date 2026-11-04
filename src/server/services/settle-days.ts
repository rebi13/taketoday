import "server-only";
import { and, asc, eq, gt, inArray, isNull, lt, sum } from "drizzle-orm";
import {
  completions,
  dailySettlements,
  users,
  walletTransactions,
  type Db,
} from "@/server/db";
import { settleDay } from "@/server/domain";
import type { LocalDate } from "@/shared/lib/date";
import type { Tx } from "./lists";

// 정산과 재화 잔액의 DB 처리(기획서 6.1·11.1, ADR 0003, 구현 계획 5.1).
// 부르는 쪽의 트랜잭션 안에서 돈다. 세션을 모르므로 PGlite 테스트(ADR 0010)에서 바로 부른다.
// 보상은 다음 날 정산한다. 지연 정산(그날 첫 요청)이 기본이고 매일 작업(#25)이 백업이다.
// 두 경로가 같은 날을 함께 잡아도 daily_settlements (user_id, local_date) 유니크로 한 번만 준다.

export type SettledDay = {
  date: LocalDate;
  /** 인정한 완료 수 */
  rewardedCount: number;
  /** 지급액 */
  amount: number;
};

/**
 * 오늘 전의 완료 중 아직 정산하지 않은 날을 모두 정산한다(부르는 쪽의 트랜잭션 안에서).
 * 날마다: settleDay로 계산 → 정산 행 쓰기(이미 있으면 건너뜀) → 지급액이 있으면 거래와
 * 인정한 완료 연결. 인정한 완료가 0개인 날도 정산 행을 남겨 다시 계산하지 않는다.
 * 이번에 새로 정산한 날을 날짜 순으로 돌려준다(P09 어제 보상 도착)
 */
export async function settlePendingDays(
  tx: Tx | Db,
  userId: string,
  today: LocalDate,
): Promise<SettledDay[]> {
  const rows = await tx
    .select({
      id: completions.id,
      userId: completions.userId,
      missionId: completions.missionId,
      localDate: completions.localDate,
      completedAt: completions.completedAt,
      canceledAt: completions.canceledAt,
    })
    .from(completions)
    .leftJoin(
      dailySettlements,
      and(
        eq(dailySettlements.userId, completions.userId),
        eq(dailySettlements.localDate, completions.localDate),
      ),
    )
    .where(
      and(
        eq(completions.userId, userId),
        lt(completions.localDate, today),
        isNull(dailySettlements.id),
      ),
    );

  const days = [...new Set(rows.map((row) => row.localDate))].sort();
  const settled: SettledDay[] = [];
  for (const date of days) {
    const payout = settleDay(date, rows).find(
      (p) => p.userId === userId && p.reason === "personal_reward",
    );
    const rewardedCount = payout?.completionIds.length ?? 0;
    const amount = payout?.amount ?? 0;

    const [settlement] = await tx
      .insert(dailySettlements)
      .values({ userId, localDate: date, rewardedCount, amount })
      // 다른 경로(매일 작업·다른 요청)가 먼저 정산했으면 건너뛴다
      .onConflictDoNothing()
      .returning({ id: dailySettlements.id });
    if (!settlement) continue;

    if (payout && amount > 0) {
      await tx.insert(walletTransactions).values({
        userId,
        amount,
        reason: "personal_reward",
        relatedId: settlement.id,
      });
      await tx
        .update(completions)
        .set({ settlementId: settlement.id })
        .where(inArray(completions.id, payout.completionIds));
    }
    settled.push({ date, rewardedCount, amount });
  }
  return settled;
}

/** 재화 잔액 = 거래 합계. 저장해 둔 값을 믿지 않는다 */
export async function walletBalance(tx: Tx | Db, userId: string) {
  const [row] = await tx
    .select({ total: sum(walletTransactions.amount) })
    .from(walletTransactions)
    .where(eq(walletTransactions.userId, userId));
  return Number(row?.total ?? 0);
}

export type RewardArrival = {
  /** 이번에 보여 줄 정산(P09를 닫으면 본 것으로 표시한다) */
  settlementIds: string[];
  /** 보상이 있는 날 수. 하루면 "어제 보상", 여러 날이면 "지난 보상" */
  days: number;
  /** 가장 최근 정산한 날 */
  latestDate: LocalDate;
  /** 합계 */
  amount: number;
};

/**
 * 아직 보여 주지 않은, 보상이 있는 정산(P09). 없으면 null.
 * 지연 정산이든 매일 작업이든 누가 정산했는지와 상관없이 다음 접속에 한 번 보여 준다
 */
export async function unseenRewards(
  tx: Tx | Db,
  userId: string,
): Promise<RewardArrival | null> {
  const rows = await tx
    .select({
      id: dailySettlements.id,
      localDate: dailySettlements.localDate,
      amount: dailySettlements.amount,
    })
    .from(dailySettlements)
    .where(
      and(
        eq(dailySettlements.userId, userId),
        isNull(dailySettlements.seenAt),
        gt(dailySettlements.amount, 0),
      ),
    )
    .orderBy(asc(dailySettlements.localDate));
  const latest = rows.at(-1);
  if (!latest) return null;
  return {
    settlementIds: rows.map((row) => row.id),
    days: rows.length,
    latestDate: latest.localDate,
    amount: rows.reduce((total, row) => total + row.amount, 0),
  };
}

/** P09를 닫았다: 그 정산들을 본 것으로 표시한다. 내 정산만, 여러 번 불러도 같다 */
export async function markRewardsSeen(
  tx: Tx | Db,
  userId: string,
  settlementIds: readonly string[],
): Promise<void> {
  if (settlementIds.length === 0) return;
  await tx
    .update(dailySettlements)
    .set({ seenAt: new Date() })
    .where(
      and(
        eq(dailySettlements.userId, userId),
        inArray(dailySettlements.id, [...settlementIds]),
        isNull(dailySettlements.seenAt),
      ),
    );
}

export type DailySettlementRun = {
  /** 이번에 정산한 사용자 수 */
  users: number;
  /** 이번에 정산한 날(사용자 × 날짜) 수 */
  days: number;
  /** 이번에 지급한 합계 */
  amount: number;
};

/**
 * 매일 작업(#25)의 백업 정산. 정산 안 한 지난 날이 있는 active 사용자를 찾아 사용자마다 한
 * 트랜잭션으로 settlePendingDays를 부른다(한 사람이 실패해도 다른 사람은 정산된다).
 * 지연 정산과 같은 함수·같은 유니크 제약을 쓰므로 여러 번 돌거나 겹쳐도 결과가 같다.
 * 탈퇴(deactivated)한 사용자는 정산하지 않는다
 */
export async function settleAllPending(
  db: Db,
  today: LocalDate,
): Promise<DailySettlementRun> {
  const pending = await db
    .selectDistinct({ userId: completions.userId })
    .from(completions)
    .innerJoin(users, eq(users.id, completions.userId))
    .leftJoin(
      dailySettlements,
      and(
        eq(dailySettlements.userId, completions.userId),
        eq(dailySettlements.localDate, completions.localDate),
      ),
    )
    .where(
      and(
        lt(completions.localDate, today),
        isNull(dailySettlements.id),
        eq(users.status, "active"),
      ),
    );

  const run: DailySettlementRun = { users: 0, days: 0, amount: 0 };
  for (const { userId } of pending) {
    const settled = await db.transaction((tx) =>
      settlePendingDays(tx, userId, today),
    );
    if (settled.length === 0) continue;
    run.users += 1;
    run.days += settled.length;
    run.amount += settled.reduce((total, day) => total + day.amount, 0);
  }
  return run;
}
