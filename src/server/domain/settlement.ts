import "server-only";
import {
  DAILY_PERSONAL_REWARD_CAP,
  MISSION_REWARD,
} from "@/shared/config/constants";
import type { LocalDate } from "@/shared/lib/date";

// 하루 정산(기획서 6.1·11.1, 구현 계획 5.1, ADR 0003).
// 취소 제외 → completedAt 순 → 미션별 첫 1건 → 앞에서 상한까지 × 1회 보상.
// 결과는 "받을 사람 목록 + 금액"이다. 공유 리스트(2단계)가 오면 한 완료로 여러 사람이 받고
// 사유(shared_reward)가 달라지므로, 상한은 받을 사람 × 거래 사유별로 센다.

/** 재화 거래 사유. MVP 정산은 personal_reward만 만든다 */
export type RewardReason = "personal_reward" | "shared_reward";

export type SettlementCompletion = {
  id: string;
  /** 수행한 사람. MVP에서는 받을 사람과 같다 */
  userId: string;
  missionId: string;
  /** 완료한 날(서울 기준) */
  localDate: LocalDate;
  completedAt: Date;
  canceledAt: Date | null;
};

export type SettlementPayout = {
  userId: string;
  reason: RewardReason;
  /** 지급액 = 인정한 완료 수 × 1회 보상 */
  amount: number;
  /** 인정한 완료(정산과 연결한다). completedAt 순 */
  completionIds: string[];
};

export type SettleOptions = {
  /** 사유별 하루 상한(인정 완료 수) */
  caps?: Partial<Record<RewardReason, number>>;
  /** 1회 보상 */
  reward?: number;
};

const DEFAULT_CAPS: Record<RewardReason, number> = {
  personal_reward: DAILY_PERSONAL_REWARD_CAP,
  // 공유 보상 상한(기획서 12장)은 2단계에서 정한다. 그전에는 쓰지 않는다
  shared_reward: 0,
};

/**
 * 그날(day)의 완료를 정산한다. 다른 날의 완료는 무시하므로 자정 직전·직후가 섞여 들어와도 된다.
 * 받을 것이 없는 사람은 결과에 넣지 않는다. 같은 입력이면 늘 같은 결과(동시각은 id 순)
 */
export function settleDay(
  day: LocalDate,
  completions: readonly SettlementCompletion[],
  { caps, reward = MISSION_REWARD }: SettleOptions = {},
): SettlementPayout[] {
  const limits = { ...DEFAULT_CAPS, ...caps };
  const ordered = completions
    .filter((c) => c.localDate === day && c.canceledAt === null)
    .toSorted(
      (a, b) =>
        a.completedAt.getTime() - b.completedAt.getTime() ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );

  // MVP: 한 완료는 수행한 사람의 개인 보상 하나. 공유 미션이 오면 여기서 받을 사람·사유가 늘어난다
  const byRecipient = new Map<string, SettlementPayout>();
  const seenMissions = new Set<string>();
  for (const completion of ordered) {
    const reason: RewardReason = "personal_reward";
    const key = `${completion.userId}:${reason}`;
    // 같은 사람·사유에서 미션별 첫 1건만
    const missionKey = `${key}:${completion.missionId}`;
    if (seenMissions.has(missionKey)) continue;
    seenMissions.add(missionKey);

    const payout = byRecipient.get(key) ?? {
      userId: completion.userId,
      reason,
      amount: 0,
      completionIds: [],
    };
    if (payout.completionIds.length >= limits[reason]) continue;
    payout.completionIds.push(completion.id);
    payout.amount = payout.completionIds.length * reward;
    byRecipient.set(key, payout);
  }
  return [...byRecipient.values()].filter((p) => p.amount > 0);
}
