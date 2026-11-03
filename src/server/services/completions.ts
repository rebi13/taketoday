import "server-only";
import { and, count, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import {
  completions,
  dailyMissions,
  getDb,
  isUniqueViolation,
  missionLists,
  missions,
} from "@/server/db";
import { canEditMission, planCompletionReward } from "@/server/domain";
import { localDate } from "@/shared/lib/date";
import type { Tx } from "./lists";
import { todayCompletions } from "./recommendations";
import { getSessionUser } from "./session";

// 완료와 내일로(구현 계획 3.2·5.3, screen-flow "하루 흐름").
// 보상은 다음 날 정산한다(ADR 0003): 완료할 때는 completion만 만들고 재화 거래는 만들지 않는다.
// 당일 취소·다시 완료는 #21.

export type CompleteMissionResult =
  | {
      ok: true;
      /** 오늘 적립 예정 수(상한까지) */
      pendingRewards: number;
      /** 이번 완료로 적립 예정이 늘었다(상한을 넘기면 false) */
      counted: boolean;
      /** 이번 완료로 하루 상한을 다 채웠다(P03) */
      reachedCap: boolean;
      /** 처음 해 본 완료(P08 보상은 내일 도착해요) */
      firstEver: boolean;
    }
  | {
      ok: false;
      /** already: 오늘 이미 완료해 적립 예정인 미션(T03) */
      reason: "login" | "invalid" | "not-found" | "already";
    };

const missionInputSchema = z.object({ missionId: z.uuid() });

/**
 * S10 완료. 추천 밖의 미션도 완료할 수 있다(그날의 미션을 recommended=false로 만든다).
 * 한 트랜잭션: 미션과 리스트 주인 읽기 → 권한 확인 → 오늘의 미션 확보 →
 * 이미 완료했는지 확인 → 완료 기록·상태 쓰기 → 적립 예정 다시 세기
 */
export async function completeMission(
  input: unknown,
): Promise<CompleteMissionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "login" };
  const parsed = missionInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const { missionId } = parsed.data;
  const today = localDate();

  try {
    return await getDb().transaction(async (tx) => {
      if (!(await canEditMine(tx, user.id, missionId))) {
        return { ok: false, reason: "not-found" } as const;
      }

      await tx
        .insert(dailyMissions)
        .values({
          userId: user.id,
          missionId,
          localDate: today,
          recommended: false,
        })
        .onConflictDoNothing();
      const [daily] = await tx
        .select({ id: dailyMissions.id })
        .from(dailyMissions)
        .where(
          and(
            eq(dailyMissions.userId, user.id),
            eq(dailyMissions.missionId, missionId),
            eq(dailyMissions.localDate, today),
          ),
        );
      const [active] = await tx
        .select({ id: completions.id })
        .from(completions)
        .where(
          and(
            eq(completions.dailyMissionId, daily.id),
            isNull(completions.canceledAt),
          ),
        );
      if (active) return { ok: false, reason: "already" } as const;

      const before = await todayCompletions(tx, user.id, today);
      await tx.insert(completions).values({
        dailyMissionId: daily.id,
        userId: user.id,
        missionId,
        localDate: today,
      });
      await tx
        .update(dailyMissions)
        .set({ status: "done" })
        .where(eq(dailyMissions.id, daily.id));

      const [{ total }] = await tx
        .select({ total: count() })
        .from(completions)
        .where(eq(completions.userId, user.id));
      const reward = planCompletionReward(before, {
        missionId,
        canceledAt: null,
      });
      return { ok: true, ...reward, firstEver: total === 1 } as const;
    });
  } catch (error) {
    // 같은 미션을 두 기기에서 동시에 눌렀다(부분 유니크 인덱스)
    if (isUniqueViolation(error, "completions_daily_mission_active_unique")) {
      return { ok: false, reason: "already" };
    }
    throw error;
  }
}

export type PostponeMissionResult =
  { ok: true } | { ok: false; reason: "login" | "invalid" | "not-found" };

/**
 * S10 내일로. 오늘 추천받은 미션 중 아직 하지 않은 것만. 다음 날 추천에서 먼저 나온다.
 * 재화나 기록에 불이익은 없다(기획서 6.3)
 */
export async function postponeMission(
  input: unknown,
): Promise<PostponeMissionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "login" };
  const parsed = missionInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const today = localDate();

  return getDb().transaction(async (tx) => {
    const [daily] = await tx
      .select({ id: dailyMissions.id, status: dailyMissions.status })
      .from(dailyMissions)
      .where(
        and(
          eq(dailyMissions.userId, user.id),
          eq(dailyMissions.missionId, parsed.data.missionId),
          eq(dailyMissions.localDate, today),
          eq(dailyMissions.recommended, true),
        ),
      );
    if (!daily) return { ok: false, reason: "not-found" } as const;
    // 이미 미뤘으면 그대로 성공. 완료했거나 취소한 것은 미루지 않는다
    if (daily.status === "postponed") return { ok: true } as const;
    if (daily.status !== "pending") {
      return { ok: false, reason: "invalid" } as const;
    }
    await tx
      .update(dailyMissions)
      .set({ status: "postponed" })
      .where(eq(dailyMissions.id, daily.id));
    return { ok: true } as const;
  });
}

/** 내 리스트의 지우지 않은 미션인가(canAccessList를 거친다) */
async function canEditMine(
  tx: Tx,
  userId: string,
  missionId: string,
): Promise<boolean> {
  const [row] = await tx
    .select({
      deletedAt: missions.deletedAt,
      ownerType: missionLists.ownerType,
      ownerId: missionLists.ownerId,
    })
    .from(missions)
    .innerJoin(missionLists, eq(missionLists.id, missions.listId))
    .where(eq(missions.id, missionId));
  return (
    row !== undefined &&
    canEditMission(
      {
        deletedAt: row.deletedAt,
        list: { ownerType: row.ownerType, ownerId: row.ownerId },
      },
      { userId },
    )
  );
}
