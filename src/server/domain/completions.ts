import "server-only";
import { DAILY_PERSONAL_REWARD_CAP } from "@/shared/config/constants";
import type { LocalDate } from "@/shared/lib/date";

// 완료와 적립 예정(기획서 6.2, ADR 0003, 구현 계획 5.1·5.3).
// 보상은 다음 날 정산한다. 그날의 "적립 예정"은 정산과 같은 규칙으로 센다:
// 취소 제외 → 미션별 첫 1건 → 앞에서 상한까지.

export type CompletionRecord = {
  missionId: string;
  canceledAt: Date | null;
};

/** 그날 적립 예정인 완료 수. 취소한 것은 빼고, 같은 미션은 한 번만, 상한까지 */
export function countPendingRewards(
  completions: readonly CompletionRecord[],
  cap: number = DAILY_PERSONAL_REWARD_CAP,
): number {
  const missions = new Set(
    completions.filter((c) => c.canceledAt === null).map((c) => c.missionId),
  );
  return Math.min(missions.size, cap);
}

/**
 * 완료 하나를 더했을 때 바뀌는 것. 화면이 P03(오늘 보상 다 모음)을 띄울지 정한다
 */
export function planCompletionReward(
  before: readonly CompletionRecord[],
  added: CompletionRecord,
  cap: number = DAILY_PERSONAL_REWARD_CAP,
): { pendingRewards: number; counted: boolean; reachedCap: boolean } {
  const previous = countPendingRewards(before, cap);
  const pendingRewards = countPendingRewards([...before, added], cap);
  return {
    pendingRewards,
    counted: pendingRewards > previous,
    reachedCap: previous < cap && pendingRewards === cap,
  };
}

/**
 * 그날의 완료를 취소하거나 다시 완료할 수 있는가(기획서 6.5).
 * 완료한 날(서울 기준) 안에서만. 자정이 지나면 그날은 정산되어 확정된다
 */
export function isChangeableDay(day: LocalDate, today: LocalDate): boolean {
  return day === today;
}
