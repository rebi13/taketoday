import { describe, expect, it } from "vitest";
import { localDate } from "@/shared/lib/date";
import { countPendingRewards } from "./completions";
import { settleDay, type SettlementCompletion } from "./settlement";

const DAY = "2026-11-03";
const ME = "user-1";
let seq = 0;

/** 서울 2026-11-03 09:00부터 분 단위로 완료 */
function done(
  missionId: string,
  minute: number,
  extra: Partial<SettlementCompletion> = {},
): SettlementCompletion {
  seq += 1;
  return {
    id: `c${String(seq).padStart(3, "0")}`,
    userId: ME,
    missionId,
    localDate: DAY,
    completedAt: new Date(Date.UTC(2026, 10, 3, 0, minute)),
    canceledAt: null,
    ...extra,
  };
}
const canceled = { canceledAt: new Date(Date.UTC(2026, 10, 3, 5)) };

describe("settleDay", () => {
  it("인정한 완료 수 × 10을 받을 사람에게 개인 보상으로 준다", () => {
    const a = done("a", 1);
    const b = done("b", 2);
    expect(settleDay(DAY, [a, b])).toEqual([
      {
        userId: ME,
        reason: "personal_reward",
        amount: 20,
        completionIds: [a.id, b.id],
      },
    ]);
  });

  it("취소한 완료는 빼고, 취소 뒤 다시 한 완료를 인정한다", () => {
    const first = done("a", 1, canceled);
    const again = done("a", 2);
    const [payout] = settleDay(DAY, [first, again]);
    expect(payout.amount).toBe(10);
    expect(payout.completionIds).toEqual([again.id]);
  });

  it("같은 미션을 하루에 3번 해도 그날은 첫 1건만 인정한다", () => {
    const first = done("a", 3);
    const [payout] = settleDay(DAY, [done("a", 5), first, done("a", 9)]);
    expect(payout.completionIds).toEqual([first.id]);
    expect(payout.amount).toBe(10);
  });

  it("같은 미션을 매일 하면 날마다 1건씩 인정한다", () => {
    const days = ["2026-11-03", "2026-11-04", "2026-11-05"];
    const daily = days.map((day, i) =>
      done("a", 0, {
        localDate: day,
        completedAt: new Date(Date.UTC(2026, 10, 3 + i, 0)),
      }),
    );
    for (const [i, day] of days.entries()) {
      expect(settleDay(day, daily)).toEqual([
        {
          userId: ME,
          reason: "personal_reward",
          amount: 10,
          completionIds: [daily[i].id],
        },
      ]);
    }
  });

  it("11개를 하면 완료 시각 순으로 앞 10개만 준다", () => {
    const eleven = Array.from({ length: 11 }, (_, i) => done(`m${i}`, i));
    const [payout] = settleDay(DAY, eleven.toReversed());
    expect(payout.amount).toBe(100);
    expect(payout.completionIds).toEqual(eleven.slice(0, 10).map((c) => c.id));
  });

  it("모두 취소했으면 아무에게도 주지 않는다", () => {
    expect(
      settleDay(DAY, [done("a", 1, canceled), done("b", 2, canceled)]),
    ).toEqual([]);
  });

  it("자정 직전은 그날, 직후는 다음 날 완료다", () => {
    const beforeMidnight = new Date("2026-11-03T14:59:59.999Z");
    const afterMidnight = new Date("2026-11-03T15:00:00.000Z");
    const late = done("a", 0, {
      completedAt: beforeMidnight,
      localDate: localDate(beforeMidnight),
    });
    const next = done("b", 0, {
      completedAt: afterMidnight,
      localDate: localDate(afterMidnight),
    });
    expect(settleDay(DAY, [late, next])[0].completionIds).toEqual([late.id]);
    expect(settleDay("2026-11-04", [late, next])[0].completionIds).toEqual([
      next.id,
    ]);
  });

  it("상한은 받을 사람마다 따로 센다", () => {
    const mine = Array.from({ length: 10 }, (_, i) => done(`m${i}`, i));
    const theirs = done("m0", 30, { userId: "user-2" });
    const payouts = settleDay(DAY, [...mine, theirs]);
    expect(payouts.map((p) => [p.userId, p.amount])).toEqual([
      [ME, 100],
      ["user-2", 10],
    ]);
  });

  it("같은 시각이면 id 순으로 정해 같은 입력은 늘 같은 결과", () => {
    const x = done("a", 1);
    const y = done("b", 1);
    const capOne = { caps: { personal_reward: 1 } };
    expect(settleDay(DAY, [y, x], capOne)[0].completionIds).toEqual([x.id]);
    expect(settleDay(DAY, [x, y], capOne)[0].completionIds).toEqual([x.id]);
  });

  it("홈의 적립 예정 수와 정산에서 인정하는 수가 같다", () => {
    const day = [
      done("a", 1, canceled),
      done("a", 2),
      done("b", 3),
      done("b", 4),
      ...Array.from({ length: 12 }, (_, i) => done(`m${i}`, 10 + i)),
    ];
    const [payout] = settleDay(DAY, day);
    expect(payout.completionIds.length).toBe(countPendingRewards(day));
  });
});
