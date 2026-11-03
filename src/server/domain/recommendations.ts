import "server-only";
import { MISSION_DUE_LEAD_DAYS } from "@/shared/config/constants";
import { addDays, diffDays, monthOf, type LocalDate } from "@/shared/lib/date";

// 오늘의 추천(구현 계획 5.2, 기획서 6.3·15.1). 날짜는 주입받아 여러 날을 시뮬레이션할 수 있다.
// 결과는 그날 처음 만들 때 daily_missions에 저장해 하루 동안 고정한다(저장은 services).

export type Season = "spring" | "summer" | "autumn" | "winter";

export type RecommendableMission = {
  id: string;
  /** 구역이 없는 미션은 다른 미션과 구역이 겹치지 않는 것으로 본다 */
  zoneId: string | null;
  active: boolean;
  kind: "recurring" | "once";
  cycleDays: number | null;
  dueDate: LocalDate | null;
  /** 기본 미션의 계절. 비어 있으면 계절 무관(직접 만든 미션도) */
  seasons: readonly Season[];
  /** 내 미션에 들어온 날. 한 번도 안 한 미션의 기준일 */
  addedOn: LocalDate;
};

/** 날짜별 미션 기록. done은 그날 완료(취소한 것은 넣지 않는다) */
export type MissionHistoryEntry = {
  missionId: string;
  date: LocalDate;
  status: "pending" | "done" | "postponed" | "canceled";
};

/** 기상청 구분과 같은 달 기준. 3~5월 봄, 6~8월 여름, 9~11월 가을, 12~2월 겨울 */
export function seasonOf(date: LocalDate): Season {
  const month = monthOf(date);
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

/**
 * 주기형의 밀린 정도 = (오늘 − 마지막 수행일) ÷ 주기. 1이면 딱 할 때, 클수록 밀렸다.
 * 한 번도 안 했으면 들어온 날에 할 때가 된 것으로 본다(들어온 날 = 1)
 */
export function overdueRatio(
  mission: { cycleDays: number; addedOn: LocalDate },
  lastDoneDate: LocalDate | null,
  today: LocalDate,
): number {
  const base = lastDoneDate ?? addDays(mission.addedOn, -mission.cycleDays);
  return diffDays(base, today) / mission.cycleDays;
}

type Candidate = {
  mission: RecommendableMission;
  /** 0 전날 "내일로", 1 기한형, 2 주기형. 작을수록 먼저 */
  tier: 0 | 1 | 2;
  /** 같은 단계 안에서 클수록 먼저 */
  score: number;
};

/**
 * 오늘 추천할 미션을 count개까지 고른다. 구역은 서로 겹치지 않게 하고,
 * 후보가 모자라면 적게 고른다(억지로 채우지 않는다, 원칙 1·2).
 *
 * 후보:
 * - 켜져 있고, 계절이 맞고(계절 미션은 그 계절에만), 오늘 이미 하지 않은 미션
 * - 주기형은 할 때가 된 것(밀린 정도 1 이상)
 * - 기한형은 마감 MISSION_DUE_LEAD_DAYS일 전부터. 마감이 지나도 끝내지 않았으면 계속 후보(벌칙 없음)
 * - 전날 "내일로" 한 미션은 위 조건과 상관없이 후보(계절·켜짐은 지킨다)
 *
 * 순서: 전날 "내일로" → 기한형(마감이 가까울수록) → 주기형(밀린 정도가 클수록).
 * 같으면 id 순으로 정해 같은 입력이면 늘 같은 결과를 낸다
 */
export function pickRecommendations(
  missions: readonly RecommendableMission[],
  history: readonly MissionHistoryEntry[],
  today: LocalDate,
  count: number,
): string[] {
  const yesterday = addDays(today, -1);
  const lastDone = new Map<string, LocalDate>();
  const postponedYesterday = new Set<string>();
  for (const entry of history) {
    if (entry.date > today) continue;
    if (entry.status === "done") {
      const prev = lastDone.get(entry.missionId);
      if (!prev || entry.date > prev) lastDone.set(entry.missionId, entry.date);
    }
    if (entry.status === "postponed" && entry.date === yesterday) {
      postponedYesterday.add(entry.missionId);
    }
  }

  const season = seasonOf(today);
  const candidates: Candidate[] = [];
  for (const mission of missions) {
    if (!mission.active) continue;
    if (mission.seasons.length > 0 && !mission.seasons.includes(season)) {
      continue;
    }
    const done = lastDone.get(mission.id) ?? null;
    if (done === today) continue;

    if (
      postponedYesterday.has(mission.id) &&
      !(mission.kind === "once" && done)
    ) {
      candidates.push({ mission, tier: 0, score: 0 });
      continue;
    }
    if (mission.kind === "once") {
      // 기한형은 한 번 하면 끝이다
      if (done || mission.dueDate === null) continue;
      const daysLeft = diffDays(today, mission.dueDate);
      if (daysLeft > MISSION_DUE_LEAD_DAYS) continue;
      candidates.push({ mission, tier: 1, score: -daysLeft });
      continue;
    }
    if (mission.cycleDays === null) continue;
    const ratio = overdueRatio(
      { cycleDays: mission.cycleDays, addedOn: mission.addedOn },
      done,
      today,
    );
    if (ratio < 1) continue;
    candidates.push({ mission, tier: 2, score: ratio });
  }

  candidates.sort(
    (a, b) =>
      a.tier - b.tier ||
      b.score - a.score ||
      (a.mission.id < b.mission.id ? -1 : a.mission.id > b.mission.id ? 1 : 0),
  );

  const picked: string[] = [];
  const usedZones = new Set<string>();
  for (const { mission } of candidates) {
    if (picked.length >= count) break;
    if (mission.zoneId !== null) {
      if (usedZones.has(mission.zoneId)) continue;
      usedZones.add(mission.zoneId);
    }
    picked.push(mission.id);
  }
  return picked;
}
