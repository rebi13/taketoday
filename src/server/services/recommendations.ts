import "server-only";
import { and, asc, eq, inArray, isNull, max, or } from "drizzle-orm";
import {
  completions,
  dailyMissions,
  getDb,
  missionLists,
  missions,
  missionTemplates,
  recommendationDays,
  users,
  zones,
} from "@/server/db";
import {
  countPendingRewards,
  pickRecommendations,
  type CompletionRecord,
  type MissionHistoryEntry,
  type RecommendableMission,
} from "@/server/domain";
import { addDays, localDate, type LocalDate } from "@/shared/lib/date";
import type { Tx } from "./lists";
import type { MissionZone } from "./missions";
import { getSessionUser } from "./session";
import {
  settlePendingDays,
  unseenRewards,
  walletBalance,
  type RewardArrival,
} from "./settle-days";

// 오늘의 추천(구현 계획 5.2, 기획서 6.7). 그날 처음 부를 때 만들어 daily_missions에 저장하고,
// 그 뒤로는 저장한 것을 그대로 돌려줘 하루 동안 바뀌지 않는다.

export type DailyMissionStatus = "pending" | "done" | "postponed" | "canceled";

/** 미션 자체의 정보(오늘 더 하기 목록에도 쓴다) */
export type TodayMissionInfo = {
  missionId: string;
  name: string;
  zone: MissionZone | null;
  kind: "recurring" | "once";
  cycleDays: number | null;
  dueDate: string | null;
  checkCriteria: string;
  /** 사용자가 완료 기준을 고쳤다 */
  userModified: boolean;
  /** 기본 미션의 지금 기준. 직접 만든 미션이면 null(P25 되돌리기) */
  templateCriteria: string | null;
};

export type TodayMission = TodayMissionInfo & {
  dailyMissionId: string;
  status: DailyMissionStatus;
};

export type TodayRecommendations = {
  /** 서울 기준 오늘 */
  date: LocalDate;
  /** 추천 순서대로. 그사이 지웠거나 꺼 둔(아직 안 한) 미션은 빠진다 */
  missions: TodayMission[];
  /** 추천 밖에서 오늘 넣었거나 직접 한 미션(오늘 더 하기, S12 오늘 했어요) */
  extra: TodayMission[];
  /** 오늘 더 하기로 고를 수 있는 켜진 내 미션(오늘 목록에 없는 것). 직접 만든 것(최근 순) → 기본 미션(구역 순) */
  addable: TodayMissionInfo[];
  /** 오늘 적립 예정 수(상한까지). 추천 밖에서 한 완료도 센다 */
  pendingRewards: number;
  /** 재화 잔액(정산까지 끝낸 뒤) */
  balance: number;
  /** 아직 보여 주지 않은 정산 보상(P09). 없으면 null */
  arrival: RewardArrival | null;
};

/**
 * S10 홈의 오늘의 추천. 로그인이 안 됐으면 null.
 * 한 트랜잭션: 밀린 정산 → 오늘 표시 남기기 → (처음이면) 내 미션·기록 읽기 → 고르기 → 저장 →
 * 오늘 추천·잔액·안 본 보상 읽기.
 * 같은 날 첫 요청이 동시에 와도 recommendation_days 기본 키에서 한쪽만 만든다
 */
export async function getTodayRecommendations(): Promise<TodayRecommendations | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const today = localDate();

  return getDb().transaction(async (tx) => {
    // 지연 정산: 지난 날의 완료를 먼저 정산한다(다음 날 첫 요청 = 홈, ADR 0003)
    await settlePendingDays(tx, user.id, today);
    const [firstToday] = await tx
      .insert(recommendationDays)
      .values({ userId: user.id, localDate: today })
      .onConflictDoNothing()
      .returning({ userId: recommendationDays.userId });
    if (firstToday) await createRecommendations(tx, user.id, today);

    const missionColumns = {
      missionId: missions.id,
      name: missions.name,
      kind: missions.kind,
      cycleDays: missions.cycleDays,
      dueDate: missions.dueDate,
      checkCriteria: missions.checkCriteria,
      userModified: missions.userModified,
      templateCriteria: missionTemplates.checkCriteria,
      zoneId: zones.id,
      zoneName: zones.name,
      zoneIcon: zones.icon,
    };
    const [rows, mine, done, balance, arrival] = await Promise.all([
      tx
        .select({
          ...missionColumns,
          dailyMissionId: dailyMissions.id,
          status: dailyMissions.status,
          recommended: dailyMissions.recommended,
        })
        .from(dailyMissions)
        .innerJoin(missions, eq(missions.id, dailyMissions.missionId))
        .leftJoin(zones, eq(zones.id, missions.zoneId))
        .leftJoin(
          missionTemplates,
          eq(missionTemplates.id, missions.templateId),
        )
        .where(
          and(
            eq(dailyMissions.userId, user.id),
            eq(dailyMissions.localDate, today),
            isNull(missions.deletedAt),
            // 그사이 꺼 둔 미션(P07 끝내기 포함)은 빠진다. 이미 하거나 취소한 것은 남긴다
            or(
              eq(missions.active, true),
              inArray(dailyMissions.status, ["done", "canceled"]),
            ),
          ),
        )
        // 추천 순서 → 추천 밖에서 넣은 순서(null은 뒤로)
        .orderBy(
          asc(dailyMissions.recommendRank),
          asc(dailyMissions.createdAt),
        ),
      // "오늘 더 하기"로 고를 수 있는 켜진 내 미션
      tx
        .select({
          ...missionColumns,
          templateId: missions.templateId,
          createdAt: missions.createdAt,
        })
        .from(missions)
        .innerJoin(missionLists, eq(missionLists.id, missions.listId))
        .leftJoin(zones, eq(zones.id, missions.zoneId))
        .leftJoin(
          missionTemplates,
          eq(missionTemplates.id, missions.templateId),
        )
        .where(
          and(
            eq(missionLists.ownerType, "user"),
            eq(missionLists.ownerId, user.id),
            isNull(missions.deletedAt),
            eq(missions.active, true),
          ),
        )
        .orderBy(asc(zones.sortOrder), asc(missions.createdAt)),
      todayCompletions(tx, user.id, today),
      walletBalance(tx, user.id),
      unseenRewards(tx, user.id),
    ]);

    const inToday = new Set(rows.map((row) => row.missionId));
    const todayRows = rows.map((row) => ({
      ...toMissionInfo(row),
      dailyMissionId: row.dailyMissionId,
      status: row.status,
      recommended: row.recommended,
    }));
    return {
      date: today,
      missions: todayRows.filter((m) => m.recommended).map(withoutFlag),
      extra: todayRows.filter((m) => !m.recommended).map(withoutFlag),
      // 직접 만든 미션을 먼저(최근 만든 순), 그다음 기본 미션을 구역 순서대로
      addable: [
        ...mine
          .filter((row) => row.templateId === null)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
        ...mine.filter((row) => row.templateId !== null),
      ]
        .filter((row) => !inToday.has(row.missionId))
        .map(toMissionInfo),
      pendingRewards: countPendingRewards(done),
      balance,
      arrival,
    };
  });
}

type MissionInfoRow = {
  missionId: string;
  name: string;
  kind: "recurring" | "once";
  cycleDays: number | null;
  dueDate: string | null;
  checkCriteria: string;
  userModified: boolean;
  templateCriteria: string | null;
  zoneId: string | null;
  zoneName: string | null;
  zoneIcon: string | null;
};

function toMissionInfo(row: MissionInfoRow): TodayMissionInfo {
  return {
    missionId: row.missionId,
    name: row.name,
    zone:
      row.zoneId !== null && row.zoneName !== null && row.zoneIcon !== null
        ? { id: row.zoneId, name: row.zoneName, icon: row.zoneIcon }
        : null,
    kind: row.kind,
    cycleDays: row.cycleDays,
    dueDate: row.dueDate,
    checkCriteria: row.checkCriteria,
    userModified: row.userModified,
    templateCriteria: row.templateCriteria,
  };
}

function withoutFlag(
  mission: TodayMission & { recommended: boolean },
): TodayMission {
  // 화면에는 추천 여부를 두 목록(missions·extra)으로 나눠 보낸다
  const { recommended, ...rest } = mission;
  void recommended;
  return rest;
}

/** 내 미션과 기록으로 오늘의 추천을 골라 저장한다 */
async function createRecommendations(
  tx: Tx,
  userId: string,
  today: LocalDate,
): Promise<void> {
  const yesterday = addDays(today, -1);
  const [[me], myMissions, lastDone, postponed] = await Promise.all([
    tx
      .select({ count: users.dailyRecommendCount })
      .from(users)
      .where(eq(users.id, userId)),
    tx
      .select({
        id: missions.id,
        zoneId: missions.zoneId,
        active: missions.active,
        kind: missions.kind,
        cycleDays: missions.cycleDays,
        dueDate: missions.dueDate,
        seasons: missionTemplates.seasons,
        createdAt: missions.createdAt,
      })
      .from(missions)
      .innerJoin(missionLists, eq(missionLists.id, missions.listId))
      .leftJoin(missionTemplates, eq(missionTemplates.id, missions.templateId))
      .where(
        and(
          eq(missionLists.ownerType, "user"),
          eq(missionLists.ownerId, userId),
          isNull(missions.deletedAt),
          eq(missions.active, true),
        ),
      ),
    // 미션마다 마지막으로 한 날. 취소한 완료는 status가 done이 아니다
    tx
      .select({
        missionId: dailyMissions.missionId,
        date: max(dailyMissions.localDate),
      })
      .from(dailyMissions)
      .where(
        and(eq(dailyMissions.userId, userId), eq(dailyMissions.status, "done")),
      )
      .groupBy(dailyMissions.missionId),
    tx
      .select({ missionId: dailyMissions.missionId })
      .from(dailyMissions)
      .where(
        and(
          eq(dailyMissions.userId, userId),
          eq(dailyMissions.localDate, yesterday),
          eq(dailyMissions.status, "postponed"),
        ),
      ),
  ]);
  if (!me) return;

  const candidates: RecommendableMission[] = myMissions.map((m) => ({
    id: m.id,
    zoneId: m.zoneId,
    active: m.active,
    kind: m.kind,
    cycleDays: m.cycleDays,
    dueDate: m.dueDate,
    seasons: m.seasons ?? [],
    addedOn: localDate(m.createdAt),
  }));
  const history: MissionHistoryEntry[] = [
    ...lastDone.flatMap((row) =>
      row.date
        ? [
            {
              missionId: row.missionId,
              date: row.date,
              status: "done" as const,
            },
          ]
        : [],
    ),
    ...postponed.map((row) => ({
      missionId: row.missionId,
      date: yesterday,
      status: "postponed" as const,
    })),
  ];

  const picked = pickRecommendations(candidates, history, today, me.count);
  if (picked.length === 0) return;
  await tx
    .insert(dailyMissions)
    .values(
      picked.map((missionId, rank) => ({
        userId,
        missionId,
        localDate: today,
        recommended: true,
        recommendRank: rank,
      })),
    )
    // 오늘 추천 밖에서 먼저 한 미션이면 그 기록을 그대로 둔다(고르기에서 이미 빠진다)
    .onConflictDoNothing();
}

/** 미션의 마지막으로 한 날(S12). 취소한 완료는 세지 않는다 */
export async function lastDoneDateOf(
  tx: Tx | ReturnType<typeof getDb>,
  userId: string,
  missionId: string,
): Promise<LocalDate | null> {
  const [row] = await tx
    .select({ date: max(dailyMissions.localDate) })
    .from(dailyMissions)
    .where(
      and(
        eq(dailyMissions.userId, userId),
        eq(dailyMissions.missionId, missionId),
        eq(dailyMissions.status, "done"),
      ),
    );
  return row?.date ?? null;
}

/** 그날 내가 한 완료(취소 포함). 적립 예정 수를 센다 */
export async function todayCompletions(
  tx: Tx,
  userId: string,
  today: LocalDate,
): Promise<CompletionRecord[]> {
  return tx
    .select({
      missionId: completions.missionId,
      canceledAt: completions.canceledAt,
    })
    .from(completions)
    .where(
      and(eq(completions.userId, userId), eq(completions.localDate, today)),
    );
}
