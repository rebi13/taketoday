import { describe, expect, it } from "vitest";
import { addDays, type LocalDate } from "@/shared/lib/date";
import {
  overdueRatio,
  pickRecommendations,
  seasonOf,
  type MissionHistoryEntry,
  type RecommendableMission,
} from "./recommendations";

const TODAY = "2026-11-03";

function recurring(
  id: string,
  zoneId: string | null,
  cycleDays: number,
  extra: Partial<RecommendableMission> = {},
): RecommendableMission {
  return {
    id,
    zoneId,
    active: true,
    kind: "recurring",
    cycleDays,
    dueDate: null,
    seasons: [],
    addedOn: "2026-10-01",
    ...extra,
  };
}

function once(
  id: string,
  zoneId: string | null,
  dueDate: LocalDate,
  extra: Partial<RecommendableMission> = {},
): RecommendableMission {
  return {
    id,
    zoneId,
    active: true,
    kind: "once",
    cycleDays: null,
    dueDate,
    seasons: [],
    addedOn: "2026-10-01",
    ...extra,
  };
}

const done = (missionId: string, date: LocalDate): MissionHistoryEntry => ({
  missionId,
  date,
  status: "done",
});

describe("seasonOf", () => {
  it("달 경계에서 계절이 바뀐다", () => {
    expect(seasonOf("2026-02-28")).toBe("winter");
    expect(seasonOf("2026-03-01")).toBe("spring");
    expect(seasonOf("2026-05-31")).toBe("spring");
    expect(seasonOf("2026-06-01")).toBe("summer");
    expect(seasonOf("2026-08-31")).toBe("summer");
    expect(seasonOf("2026-09-01")).toBe("autumn");
    expect(seasonOf("2026-11-30")).toBe("autumn");
    expect(seasonOf("2026-12-01")).toBe("winter");
    expect(seasonOf("2027-01-15")).toBe("winter");
  });
});

describe("overdueRatio", () => {
  it("(오늘 − 마지막 수행일) ÷ 주기", () => {
    const mission = { cycleDays: 7, addedOn: "2026-10-01" };
    expect(overdueRatio(mission, "2026-10-27", TODAY)).toBe(1);
    expect(overdueRatio(mission, "2026-10-20", TODAY)).toBe(2);
    expect(overdueRatio(mission, "2026-11-02", TODAY)).toBeCloseTo(1 / 7);
  });

  it("한 번도 안 했으면 들어온 날 1에서 시작한다", () => {
    expect(overdueRatio({ cycleDays: 7, addedOn: TODAY }, null, TODAY)).toBe(1);
    expect(
      overdueRatio({ cycleDays: 7, addedOn: "2026-10-27" }, null, TODAY),
    ).toBe(2);
  });
});

describe("pickRecommendations", () => {
  it("밀린 정도가 큰 미션부터 고른다", () => {
    const missions = [
      recurring("a", "desk", 7),
      recurring("b", "bath", 7),
      recurring("c", "bed", 7),
    ];
    const history = [
      done("a", "2026-10-27"), // 1
      done("b", "2026-10-13"), // 3
      done("c", "2026-10-20"), // 2
    ];
    expect(pickRecommendations(missions, history, TODAY, 2)).toEqual([
      "b",
      "c",
    ]);
  });

  it("같은 구역에서는 하나만 고른다", () => {
    const missions = [
      recurring("a", "desk", 1),
      recurring("b", "desk", 1),
      recurring("c", "bath", 1),
    ];
    const history = [
      done("a", "2026-10-30"),
      done("b", "2026-10-31"),
      done("c", "2026-11-02"),
    ];
    expect(pickRecommendations(missions, history, TODAY, 2)).toEqual([
      "a",
      "c",
    ]);
  });

  it("구역이 없는 미션끼리는 겹치지 않는 것으로 본다", () => {
    const missions = [recurring("a", null, 1), recurring("b", null, 1)];
    expect(pickRecommendations(missions, [], TODAY, 2)).toEqual(["a", "b"]);
  });

  it("할 때가 안 된 주기형은 고르지 않고, 후보가 모자라면 적게 고른다", () => {
    const missions = [recurring("a", "desk", 7), recurring("b", "bath", 7)];
    const history = [done("a", "2026-10-27"), done("b", "2026-11-01")];
    expect(pickRecommendations(missions, history, TODAY, 2)).toEqual(["a"]);
  });

  it("꺼 둔 미션과 오늘 이미 한 미션은 고르지 않는다", () => {
    const missions = [
      recurring("off", "desk", 1, { active: false }),
      recurring("today", "bath", 1),
      recurring("ok", "bed", 1),
    ];
    const history = [done("today", TODAY)];
    expect(pickRecommendations(missions, history, TODAY, 2)).toEqual(["ok"]);
  });

  it("계절 미션은 그 계절에만 고른다", () => {
    const missions = [
      recurring("summer", "desk", 30, { seasons: ["summer"] }),
      recurring("autumn", "bath", 30, { seasons: ["spring", "autumn"] }),
    ];
    expect(pickRecommendations(missions, [], TODAY, 2)).toEqual(["autumn"]);
    expect(pickRecommendations(missions, [], "2027-07-01", 2)).toEqual([
      "summer",
    ]);
  });

  describe("기한형", () => {
    it("마감 3일 전부터 후보가 된다", () => {
      expect(
        pickRecommendations([once("a", "desk", "2026-11-07")], [], TODAY, 2),
      ).toEqual([]);
      expect(
        pickRecommendations([once("a", "desk", "2026-11-06")], [], TODAY, 2),
      ).toEqual(["a"]);
    });

    it("마감이 가까울수록 먼저, 주기형보다 먼저 고른다", () => {
      const missions = [
        recurring("r", "bed", 1, { addedOn: "2026-01-01" }),
        once("later", "desk", "2026-11-05"),
        once("sooner", "bath", "2026-11-04"),
      ];
      expect(pickRecommendations(missions, [], TODAY, 2)).toEqual([
        "sooner",
        "later",
      ]);
    });

    it("마감이 지나도 끝내지 않았으면 계속 후보이고, 한 번 하면 끝난다", () => {
      const missions = [once("a", "desk", "2026-10-30")];
      expect(pickRecommendations(missions, [], TODAY, 2)).toEqual(["a"]);
      expect(
        pickRecommendations(missions, [done("a", "2026-11-01")], TODAY, 2),
      ).toEqual([]);
    });
  });

  describe("전날 ‘내일로’", () => {
    const postponed = (missionId: string, date: LocalDate) =>
      ({ missionId, date, status: "postponed" }) as const;

    it("다음 날 가장 먼저 고른다", () => {
      const missions = [
        recurring("a", "desk", 7),
        recurring("b", "bath", 7),
        once("c", "bed", TODAY),
      ];
      const history = [
        done("a", "2026-09-01"), // 아주 밀림
        done("b", "2026-10-26"),
        postponed("b", "2026-11-02"),
      ];
      expect(pickRecommendations(missions, history, TODAY, 2)).toEqual([
        "b",
        "c",
      ]);
    });

    it("이틀 전에 미룬 것은 우선하지 않는다", () => {
      const missions = [recurring("a", "desk", 7), recurring("b", "bath", 7)];
      const history = [
        done("a", "2026-10-13"),
        done("b", "2026-10-26"),
        postponed("b", "2026-11-01"),
      ];
      expect(pickRecommendations(missions, history, TODAY, 1)).toEqual(["a"]);
    });

    it("꺼 두었거나 계절이 지났으면 고르지 않는다", () => {
      const missions = [
        recurring("off", "desk", 7, { active: false }),
        recurring("summer", "bath", 7, { seasons: ["summer"] }),
      ];
      const history = [
        postponed("off", "2026-11-02"),
        postponed("summer", "2026-11-02"),
      ];
      expect(pickRecommendations(missions, history, TODAY, 2)).toEqual([]);
    });
  });

  it("같은 입력이면 같은 결과(동점은 id 순)", () => {
    const missions = [recurring("b", "bath", 1), recurring("a", "desk", 1)];
    expect(pickRecommendations(missions, [], TODAY, 1)).toEqual(["a"]);
    expect(pickRecommendations([...missions].reverse(), [], TODAY, 1)).toEqual([
      "a",
    ]);
  });

  it("오늘 뒤의 기록은 보지 않는다", () => {
    const missions = [recurring("a", "desk", 7)];
    expect(
      pickRecommendations(missions, [done("a", "2026-11-04")], TODAY, 1),
    ).toEqual(["a"]);
  });
});

describe("pickRecommendations: 여러 날 시뮬레이션", () => {
  /** 매일 추천을 만들고, 추천받은 것을 그날 하거나(do) 내일로 미룬다(postpone) */
  function simulate(
    missions: RecommendableMission[],
    start: LocalDate,
    days: number,
    act: (date: LocalDate, picked: string[]) => MissionHistoryEntry[],
  ): { date: LocalDate; picked: string[] }[] {
    const history: MissionHistoryEntry[] = [];
    const log: { date: LocalDate; picked: string[] }[] = [];
    for (let i = 0; i < days; i++) {
      const date = addDays(start, i);
      const picked = pickRecommendations(missions, history, date, 2);
      log.push({ date, picked });
      history.push(...act(date, picked));
    }
    return log;
  }

  it("추천받은 것을 다 하면 주기에 맞춰 돌아가며 나온다", () => {
    const missions = [
      recurring("daily-desk", "desk", 1, { addedOn: "2026-11-01" }),
      recurring("weekly-bath", "bath", 7, { addedOn: "2026-11-01" }),
      recurring("weekly-bed", "bed", 7, { addedOn: "2026-11-01" }),
    ];
    const log = simulate(missions, "2026-11-01", 14, (date, picked) =>
      picked.map((id) => done(id, date)),
    );
    const count = (id: string) =>
      log.filter((day) => day.picked.includes(id)).length;
    // 매일 미션은 다른 하나와 짝을 지어 거의 매일, 주 1회 미션은 주기마다 한 번씩
    expect(count("weekly-bath")).toBe(2);
    expect(count("weekly-bed")).toBe(2);
    expect(count("daily-desk")).toBe(14);
    // 같은 날 두 개는 늘 다른 구역
    for (const day of log) {
      expect(new Set(day.picked).size).toBe(day.picked.length);
    }
  });

  it("‘내일로’ 한 미션은 다음 날 우선된다", () => {
    const missions = [
      recurring("a", "desk", 1, { addedOn: "2026-10-01" }), // 많이 밀림
      recurring("b", "bath", 1, { addedOn: "2026-10-20" }),
      recurring("c", "bed", 1, { addedOn: "2026-11-02" }),
    ];
    // 첫날 b를 미루고 나머지는 한다. 둘째 날에는 b가 맨 앞에 온다
    const log = simulate(missions, TODAY, 2, (date, picked) =>
      picked.map((id) =>
        id === "b"
          ? { missionId: id, date, status: "postponed" as const }
          : done(id, date),
      ),
    );
    expect(log[0].picked).toEqual(["a", "b"]);
    expect(log[1].picked[0]).toBe("b");
  });
});
