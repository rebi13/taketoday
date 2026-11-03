import { describe, expect, it } from "vitest";
import { localDate } from "@/shared/lib/date";
import {
  countPendingRewards,
  isChangeableDay,
  planCompletionReward,
} from "./completions";

const done = (missionId: string) => ({ missionId, canceledAt: null });
const canceled = (missionId: string) => ({
  missionId,
  canceledAt: new Date("2026-11-03T03:00:00Z"),
});

describe("countPendingRewards", () => {
  it("취소한 완료는 세지 않는다", () => {
    expect(countPendingRewards([done("a"), canceled("b")])).toBe(1);
    expect(countPendingRewards([canceled("a"), canceled("b")])).toBe(0);
  });

  it("완료 → 취소 → 다시 완료는 1건이다", () => {
    expect(countPendingRewards([canceled("a"), done("a")])).toBe(1);
  });

  it("같은 미션을 여러 번 해도 1건이다", () => {
    expect(countPendingRewards([done("a"), done("a"), done("a")])).toBe(1);
  });

  it("하루 상한 10건까지만 센다", () => {
    const eleven = Array.from({ length: 11 }, (_, i) => done(`m${i}`));
    expect(countPendingRewards(eleven)).toBe(10);
  });
});

describe("planCompletionReward", () => {
  it("새 미션이면 적립 예정이 하나 늘어난다", () => {
    expect(planCompletionReward([done("a")], done("b"))).toEqual({
      pendingRewards: 2,
      counted: true,
      reachedCap: false,
    });
  });

  it("10번째 적립이면 상한에 닿았다고 알린다", () => {
    const nine = Array.from({ length: 9 }, (_, i) => done(`m${i}`));
    expect(planCompletionReward(nine, done("m9"))).toEqual({
      pendingRewards: 10,
      counted: true,
      reachedCap: true,
    });
  });

  it("상한을 넘긴 완료는 세지 않고 다시 알리지 않는다", () => {
    const ten = Array.from({ length: 10 }, (_, i) => done(`m${i}`));
    expect(planCompletionReward(ten, done("m10"))).toEqual({
      pendingRewards: 10,
      counted: false,
      reachedCap: false,
    });
  });

  it("취소했던 미션을 다시 하면 다시 센다", () => {
    expect(planCompletionReward([canceled("a")], done("a"))).toEqual({
      pendingRewards: 1,
      counted: true,
      reachedCap: false,
    });
  });
});

describe("isChangeableDay: 취소·다시 완료는 그날 안에서만", () => {
  // 서울 2026-11-03 23:59:59에 완료했다
  const doneDay = localDate(new Date("2026-11-03T14:59:59.000Z"));

  it("같은 날 자정 전이면 된다", () => {
    const now = localDate(new Date("2026-11-03T14:59:59.999Z"));
    expect(isChangeableDay(doneDay, now)).toBe(true);
  });

  it("자정이 지나면(서울 00:00) 어제 완료는 취소·다시 완료할 수 없다", () => {
    const now = localDate(new Date("2026-11-03T15:00:00.000Z"));
    expect(now).toBe("2026-11-04");
    expect(isChangeableDay(doneDay, now)).toBe(false);
  });

  it("완료 → 취소 → 다시 완료는 적립 예정 1건이다", () => {
    const cancel = planCompletionReward([], done("a"));
    expect(cancel.pendingRewards).toBe(1);
    expect(
      planCompletionReward([canceled("a")], done("a")).pendingRewards,
    ).toBe(1);
    expect(countPendingRewards([canceled("a"), done("a")])).toBe(1);
  });
});
