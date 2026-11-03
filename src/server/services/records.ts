import "server-only";
import { and, asc, desc, eq, gte, isNull, max } from "drizzle-orm";
import {
  completions,
  dailyMissions,
  getDb,
  missionLists,
  missions,
  zones,
} from "@/server/db";
import { countPendingRewards } from "@/server/domain";
import { localDate, type LocalDate } from "@/shared/lib/date";
import type { DailyMissionStatus } from "./recommendations";
import type { MissionZone } from "./missions";
import { getSessionUser } from "./session";

// S16 기록·S17 날짜별 상세(기획서 6.7, screen-flow "기록").
// "10월 28일에 무엇을 추천받았고 무엇을 했는지"가 그대로 남는다. 지운 미션의 기록도 남긴다.

/** 한 번에 보여 줄 기록 있는 날 수. 더 지난 기록은 나중에 "더 보기"로 */
const RECORD_DAYS = 30;

export type RecordEntry = {
  dailyMissionId: string;
  missionId: string;
  name: string;
  zone: MissionZone | null;
  status: DailyMissionStatus;
  /** 그날의 추천으로 들어왔다. 추천 밖에서 직접 한 것은 false */
  recommended: boolean;
  /** 그 뒤에 지운 미션. 기록에는 남지만 다시 완료할 수 없다 */
  deleted: boolean;
};

export type RecordDay = {
  date: LocalDate;
  /** 추천 순서 → 추천 밖에서 한 것 순 */
  entries: RecordEntry[];
  /** 그날 보상으로 인정되는 완료 수(정산과 같은 규칙, 상한까지) */
  rewardCount: number;
};

export type ZoneLastDone = {
  zone: MissionZone;
  /** 그 구역 미션을 마지막으로 한 날. 아직 없으면 null */
  lastDoneDate: LocalDate | null;
};

export type Records = {
  /** 서울 기준 오늘(오늘 기록만 취소·다시 완료할 수 있다) */
  today: LocalDate;
  /** 최근 기록 있는 날부터 */
  days: RecordDay[];
  /** 내 미션이 있는 구역만, 구역 순서대로 */
  zones: ZoneLastDone[];
};

/** S16 화면 데이터. 로그인이 안 됐으면 null. 읽기만 한다 */
export async function getRecords(): Promise<Records | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const today = localDate();
  const db = getDb();

  const [recentDates, zoneRows] = await Promise.all([
    db
      .selectDistinct({ date: dailyMissions.localDate })
      .from(dailyMissions)
      .where(eq(dailyMissions.userId, user.id))
      .orderBy(desc(dailyMissions.localDate))
      .limit(RECORD_DAYS),
    // 내 리스트의 지우지 않은 미션이 있는 구역과, 그 구역에서 마지막으로 완료한 날
    db
      .select({
        id: zones.id,
        name: zones.name,
        icon: zones.icon,
        lastDoneDate: max(dailyMissions.localDate),
      })
      .from(missions)
      .innerJoin(missionLists, eq(missionLists.id, missions.listId))
      .innerJoin(zones, eq(zones.id, missions.zoneId))
      .leftJoin(
        dailyMissions,
        and(
          eq(dailyMissions.missionId, missions.id),
          eq(dailyMissions.userId, user.id),
          eq(dailyMissions.status, "done"),
        ),
      )
      .where(
        and(
          eq(missionLists.ownerType, "user"),
          eq(missionLists.ownerId, user.id),
          isNull(missions.deletedAt),
        ),
      )
      .groupBy(zones.id, zones.name, zones.icon, zones.sortOrder)
      .orderBy(asc(zones.sortOrder)),
  ]);

  const zoneList: ZoneLastDone[] = zoneRows.map((row) => ({
    zone: { id: row.id, name: row.name, icon: row.icon },
    lastDoneDate: row.lastDoneDate,
  }));
  const oldest = recentDates.at(-1)?.date;
  if (!oldest) return { today, days: [], zones: zoneList };

  const [entryRows, completionRows] = await Promise.all([
    db
      .select({
        dailyMissionId: dailyMissions.id,
        date: dailyMissions.localDate,
        status: dailyMissions.status,
        recommended: dailyMissions.recommended,
        recommendRank: dailyMissions.recommendRank,
        createdAt: dailyMissions.createdAt,
        missionId: missions.id,
        name: missions.name,
        deletedAt: missions.deletedAt,
        zoneId: zones.id,
        zoneName: zones.name,
        zoneIcon: zones.icon,
      })
      .from(dailyMissions)
      .innerJoin(missions, eq(missions.id, dailyMissions.missionId))
      .leftJoin(zones, eq(zones.id, missions.zoneId))
      .where(
        and(
          eq(dailyMissions.userId, user.id),
          gte(dailyMissions.localDate, oldest),
        ),
      )
      .orderBy(
        desc(dailyMissions.localDate),
        asc(dailyMissions.recommendRank),
        asc(dailyMissions.createdAt),
      ),
    db
      .select({
        date: completions.localDate,
        missionId: completions.missionId,
        canceledAt: completions.canceledAt,
      })
      .from(completions)
      .where(
        and(
          eq(completions.userId, user.id),
          gte(completions.localDate, oldest),
        ),
      ),
  ]);

  const days = new Map<LocalDate, RecordDay>();
  for (const { date } of recentDates) {
    days.set(date, {
      date,
      entries: [],
      rewardCount: countPendingRewards(
        completionRows.filter((c) => c.date === date),
      ),
    });
  }
  for (const row of entryRows) {
    days.get(row.date)?.entries.push({
      dailyMissionId: row.dailyMissionId,
      missionId: row.missionId,
      name: row.name,
      zone:
        row.zoneId !== null && row.zoneName !== null && row.zoneIcon !== null
          ? { id: row.zoneId, name: row.zoneName, icon: row.zoneIcon }
          : null,
      status: row.status,
      recommended: row.recommended,
      deleted: row.deletedAt !== null,
    });
  }

  return { today, days: [...days.values()], zones: zoneList };
}
