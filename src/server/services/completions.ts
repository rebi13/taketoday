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
import {
  canEditMission,
  countPendingRewards,
  isChangeableDay,
  planCompletionReward,
} from "@/server/domain";
import { localDate, localDateSchema } from "@/shared/lib/date";
import type { Tx } from "./lists";
import { todayCompletions } from "./recommendations";
import { getSessionUser } from "./session";

// 완료와 내일로(구현 계획 3.2·5.3, screen-flow "하루 흐름").
// 보상은 다음 날 정산한다(ADR 0003): 완료할 때는 completion만 만들고 재화 거래는 만들지 않는다.
// 취소는 그날 안에서만, 지우지 않고 canceled_at을 채운다. 취소한 미션은 같은 날 다시 완료할 수 있다(새 completion).

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
      /**
       * already: 오늘 이미 완료해 적립 예정인 미션(T03).
       * past-day: 화면이 보던 날이 지났다(자정을 넘긴 화면에서 누름)
       */
      reason: "login" | "invalid" | "not-found" | "already" | "past-day";
    };

const missionInputSchema = z.object({ missionId: z.uuid() });

/** 화면이 보고 있던 날(서울 기준)을 함께 보내면 그날이 지났을 때 거부한다 */
const dayInputSchema = missionInputSchema.extend({
  date: localDateSchema.optional(),
});

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
  const parsed = dayInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const { missionId, date } = parsed.data;
  const today = localDate();
  if (date !== undefined && !isChangeableDay(date, today)) {
    return { ok: false, reason: "past-day" };
  }

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

export type CancelCompletionResult =
  | { ok: true; pendingRewards: number }
  | {
      ok: false;
      /** past-day: 자정이 지나 그날이 확정됐다(기획서 6.5) */
      reason: "login" | "invalid" | "not-found" | "past-day";
    };

const cancelSchema = missionInputSchema.extend({ date: localDateSchema });

/**
 * 완료 취소(홈 T01 되돌리기, 기록 P04). 완료한 날 안에서만, 지우지 않고 canceled_at을 채운다.
 * 한 트랜잭션: 그날의 미션과 취소하지 않은 완료 읽기 → 취소 표시·상태 쓰기 → 적립 예정 다시 세기.
 * 취소할 완료가 없으면(이미 취소함) not-found
 */
export async function cancelCompletion(
  input: unknown,
): Promise<CancelCompletionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "login" };
  const parsed = cancelSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const { missionId, date } = parsed.data;
  const today = localDate();
  if (!isChangeableDay(date, today)) return { ok: false, reason: "past-day" };

  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .select({
        dailyMissionId: dailyMissions.id,
        completionId: completions.id,
      })
      .from(dailyMissions)
      .innerJoin(
        completions,
        and(
          eq(completions.dailyMissionId, dailyMissions.id),
          isNull(completions.canceledAt),
        ),
      )
      .where(
        and(
          eq(dailyMissions.userId, user.id),
          eq(dailyMissions.missionId, missionId),
          eq(dailyMissions.localDate, today),
        ),
      );
    if (!row) return { ok: false, reason: "not-found" } as const;

    await tx
      .update(completions)
      .set({ canceledAt: new Date() })
      .where(eq(completions.id, row.completionId));
    await tx
      .update(dailyMissions)
      .set({ status: "canceled" })
      .where(eq(dailyMissions.id, row.dailyMissionId));
    return {
      ok: true,
      pendingRewards: countPendingRewards(
        await todayCompletions(tx, user.id, today),
      ),
    } as const;
  });
}

export type PostponeMissionResult =
  { ok: true } | { ok: false; reason: "login" | "invalid" | "not-found" };

/**
 * S10 내일로. 오늘의 미션(추천·오늘 더 하기) 중 아직 하지 않은 것만. 다음 날 추천에서 먼저 나온다.
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

export type TodayListResult =
  { ok: true } | { ok: false; reason: "login" | "invalid" | "not-found" };

/**
 * S10 오늘 더 하기. 추천 밖의 켜진 내 미션을 오늘의 미션(recommended=false)으로 넣는다.
 * 이미 오늘 목록에 있으면 그대로 성공
 */
export async function addToToday(input: unknown): Promise<TodayListResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "login" };
  const parsed = missionInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const { missionId } = parsed.data;
  const today = localDate();

  return getDb().transaction(async (tx) => {
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
    return { ok: true } as const;
  });
}

/**
 * S10 오늘 더 하기에서 넣은 것 빼기. 추천받은 것과 한 번이라도 완료한 것(취소 포함)은
 * 기록이므로 빼지 않는다. 이미 없으면 그대로 성공
 */
export async function removeFromToday(
  input: unknown,
): Promise<TodayListResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "login" };
  const parsed = missionInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const today = localDate();

  return getDb().transaction(async (tx) => {
    const [daily] = await tx
      .select({
        id: dailyMissions.id,
        recommended: dailyMissions.recommended,
        completionId: completions.id,
      })
      .from(dailyMissions)
      .leftJoin(completions, eq(completions.dailyMissionId, dailyMissions.id))
      .where(
        and(
          eq(dailyMissions.userId, user.id),
          eq(dailyMissions.missionId, parsed.data.missionId),
          eq(dailyMissions.localDate, today),
        ),
      );
    if (!daily) return { ok: true } as const;
    if (daily.recommended || daily.completionId !== null) {
      return { ok: false, reason: "invalid" } as const;
    }
    await tx.delete(dailyMissions).where(eq(dailyMissions.id, daily.id));
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
