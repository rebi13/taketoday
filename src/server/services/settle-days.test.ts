import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import {
  completions,
  dailyMissions,
  dailySettlements,
  missionLists,
  missions,
  users,
  walletTransactions,
  type Db,
} from "@/server/db";
import { createTestDb } from "@/server/db/testing";
import {
  settleAllPending,
  settlePendingDays,
  walletBalance,
} from "./settle-days";

// 정산을 실제 SQL로 확인한다(PGlite, ADR 0010).
// 핵심: 같은 날을 두 번 정산해도 한 번만 지급된다(M3 완료 기준).

const TODAY = "2026-11-04";
const YESTERDAY = "2026-11-03";

let db: Db;
let close: () => Promise<void>;
let userId: string;
let listId: string;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  [{ id: userId }] = await db
    .insert(users)
    .values({ email: "tester@example.test" })
    .returning({ id: users.id });
  [{ id: listId }] = await db
    .insert(missionLists)
    .values({ ownerType: "user", ownerId: userId })
    .returning({ id: missionLists.id });
});

afterEach(async () => {
  await close();
});

/** 미션 하나를 만들고 그날 완료한다. 취소했으면 canceled */
async function complete(
  date: string,
  name: string,
  { canceled = false, at = `${date}T01:00:00Z` } = {},
) {
  const [mission] = await db
    .insert(missions)
    .values({
      listId,
      kind: "recurring",
      name,
      checkCriteria: `${name}면 완료`,
      cycleDays: 1,
    })
    .returning({ id: missions.id });
  return completeMission(date, mission.id, { canceled, at });
}

async function completeMission(
  date: string,
  missionId: string,
  { canceled = false, at = `${date}T01:00:00Z` } = {},
) {
  await db
    .insert(dailyMissions)
    .values({ userId, missionId, localDate: date, recommended: false })
    .onConflictDoNothing();
  const [daily] = await db
    .select({ id: dailyMissions.id })
    .from(dailyMissions)
    .where(eq(dailyMissions.missionId, missionId));
  const [row] = await db
    .insert(completions)
    .values({
      dailyMissionId: daily.id,
      userId,
      missionId,
      localDate: date,
      completedAt: new Date(at),
      canceledAt: canceled ? new Date(at) : null,
    })
    .returning({ id: completions.id });
  return { missionId, completionId: row.id };
}

describe("settlePendingDays", () => {
  it("어제 완료를 정산해 거래를 만들고 인정한 완료를 정산에 잇는다", async () => {
    const a = await complete(YESTERDAY, "컵 치우기");
    await complete(YESTERDAY, "이불 개기");

    const settled = await settlePendingDays(db, userId, TODAY);

    expect(settled).toEqual([
      { date: YESTERDAY, rewardedCount: 2, amount: 20 },
    ]);
    expect(await walletBalance(db, userId)).toBe(20);
    const [link] = await db
      .select({ settlementId: completions.settlementId })
      .from(completions)
      .where(eq(completions.id, a.completionId));
    const [settlement] = await db.select().from(dailySettlements);
    expect(link.settlementId).toBe(settlement.id);
  });

  it("같은 날을 두 번 정산해도 한 번만 지급한다", async () => {
    await complete(YESTERDAY, "컵 치우기");

    const first = await settlePendingDays(db, userId, TODAY);
    const second = await settlePendingDays(db, userId, TODAY);

    expect(first).toHaveLength(1);
    expect(second).toEqual([]);
    expect(await db.select().from(dailySettlements)).toHaveLength(1);
    expect(await db.select().from(walletTransactions)).toHaveLength(1);
    expect(await walletBalance(db, userId)).toBe(10);
  });

  it("두 경로가 동시에 정산해도(지연 정산과 매일 작업) 한 번만 지급한다", async () => {
    await complete(YESTERDAY, "컵 치우기");

    await Promise.all([
      db.transaction((tx) => settlePendingDays(tx, userId, TODAY)),
      db.transaction((tx) => settlePendingDays(tx, userId, TODAY)),
    ]);

    expect(await walletBalance(db, userId)).toBe(10);
  });

  it("이미 정산 행이 있으면 다시 계산하지 않는다(유니크 제약이 마지막 안전장치)", async () => {
    await complete(YESTERDAY, "컵 치우기");
    await db
      .insert(dailySettlements)
      .values({ userId, localDate: YESTERDAY, rewardedCount: 0, amount: 0 });

    expect(await settlePendingDays(db, userId, TODAY)).toEqual([]);
    expect(await walletBalance(db, userId)).toBe(0);
  });

  it("오늘 완료는 아직 정산하지 않는다", async () => {
    await complete(TODAY, "컵 치우기");

    expect(await settlePendingDays(db, userId, TODAY)).toEqual([]);
    expect(await walletBalance(db, userId)).toBe(0);
  });

  it("모두 취소한 날은 0으로 정산해 두고 거래는 만들지 않는다", async () => {
    await complete(YESTERDAY, "컵 치우기", { canceled: true });

    expect(await settlePendingDays(db, userId, TODAY)).toEqual([
      { date: YESTERDAY, rewardedCount: 0, amount: 0 },
    ]);
    expect(await db.select().from(walletTransactions)).toHaveLength(0);
  });

  it("완료 → 취소 → 다시 완료는 10", async () => {
    const { missionId } = await complete(YESTERDAY, "컵 치우기", {
      canceled: true,
      at: `${YESTERDAY}T01:00:00Z`,
    });
    await completeMission(YESTERDAY, missionId, {
      at: `${YESTERDAY}T02:00:00Z`,
    });

    await settlePendingDays(db, userId, TODAY);
    expect(await walletBalance(db, userId)).toBe(10);
  });

  it("하루 11개를 해도 100까지만, 며칠 밀려도 날마다 따로 정산한다", async () => {
    for (let i = 0; i < 11; i++) {
      await complete("2026-11-01", `미션 ${i}`, {
        at: `2026-11-01T0${Math.floor(i / 6)}:${String(i * 5).padStart(2, "0")}:00Z`,
      });
    }
    await complete("2026-11-02", "컵 치우기");

    const settled = await settlePendingDays(db, userId, TODAY);

    expect(settled).toEqual([
      { date: "2026-11-01", rewardedCount: 10, amount: 100 },
      { date: "2026-11-02", rewardedCount: 1, amount: 10 },
    ]);
    expect(await walletBalance(db, userId)).toBe(110);
  });
});

describe("settleAllPending: 매일 작업의 백업 정산", () => {
  /** 다른 사용자와 그 리스트를 만들고, 그 사용자로 바꿔 완료를 넣는다 */
  async function asNewUser(email: string, status: "active" | "deactivated") {
    const [user] = await db
      .insert(users)
      .values({
        email,
        status,
        deactivatedAt: status === "deactivated" ? new Date() : null,
      })
      .returning({ id: users.id });
    const [list] = await db
      .insert(missionLists)
      .values({ ownerType: "user", ownerId: user.id })
      .returning({ id: missionLists.id });
    userId = user.id;
    listId = list.id;
    return user.id;
  }

  it("접속하지 않은 사용자들의 미정산 날을 정산한다", async () => {
    const first = userId;
    await complete(YESTERDAY, "컵 치우기");
    const second = await asNewUser("second@example.test", "active");
    await complete("2026-11-02", "이불 개기");
    await complete(YESTERDAY, "창문 열기");

    const run = await settleAllPending(db, TODAY);

    expect(run).toEqual({ users: 2, days: 3, amount: 30 });
    expect(await walletBalance(db, first)).toBe(10);
    expect(await walletBalance(db, second)).toBe(20);
  });

  it("두 번 돌거나 지연 정산이 먼저 했어도 다시 주지 않는다", async () => {
    await complete(YESTERDAY, "컵 치우기");
    await settlePendingDays(db, userId, TODAY);

    expect(await settleAllPending(db, TODAY)).toEqual({
      users: 0,
      days: 0,
      amount: 0,
    });
    await settleAllPending(db, TODAY);
    expect(await walletBalance(db, userId)).toBe(10);
  });

  it("오늘 완료와 탈퇴한 사용자는 정산하지 않는다", async () => {
    await complete(TODAY, "컵 치우기");
    const leaving = await asNewUser("leaving@example.test", "deactivated");
    await complete(YESTERDAY, "이불 개기");

    expect(await settleAllPending(db, TODAY)).toEqual({
      users: 0,
      days: 0,
      amount: 0,
    });
    expect(await walletBalance(db, leaving)).toBe(0);
  });
});
