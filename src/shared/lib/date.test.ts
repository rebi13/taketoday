import { afterEach, describe, expect, it } from "vitest";
import {
  addDays,
  diffDays,
  localDate,
  localDateSchema,
  monthOf,
  weekdayOf,
} from "./date";

describe("localDate: 서울 자정 경계", () => {
  it("서울 23:59:59는 그날이다", () => {
    expect(localDate(new Date("2026-11-01T14:59:59.999Z"))).toBe("2026-11-01");
  });

  it("서울 00:00:00부터 다음 날이다", () => {
    expect(localDate(new Date("2026-11-01T15:00:00.000Z"))).toBe("2026-11-02");
  });

  it("UTC로는 전날인 시각도 서울 날짜를 쓴다", () => {
    // UTC 10-31 20:00 = 서울 11-01 05:00
    expect(localDate(new Date("2026-10-31T20:00:00Z"))).toBe("2026-11-01");
  });

  it("해가 바뀌는 자정", () => {
    expect(localDate(new Date("2026-12-31T14:59:59Z"))).toBe("2026-12-31");
    expect(localDate(new Date("2026-12-31T15:00:00Z"))).toBe("2027-01-01");
  });

  it("인자가 없으면 지금 시각을 쓴다", () => {
    expect(localDateSchema.safeParse(localDate()).success).toBe(true);
  });
});

describe("localDate: 서버·기기 시간대와 무관", () => {
  const original = process.env.TZ;
  afterEach(() => {
    process.env.TZ = original;
  });

  // Vercel 함수는 UTC, 개발 PC는 서울, 해외 기기는 다른 시간대일 수 있다.
  // 미국은 11월 첫 일요일에 서머타임이 끝나므로 그 주변 시각도 본다.
  for (const tz of [
    "UTC",
    "Asia/Seoul",
    "America/New_York",
    "Pacific/Kiritimati",
  ]) {
    it(`프로세스 시간대가 ${tz}여도 같다`, () => {
      process.env.TZ = "UTC";
      // 시간대 바꾸기가 실제로 먹는지 확인: UTC에서 Date를 그냥 자르면 전날이 나온다
      expect(new Date("2026-11-01T15:00:00Z").getDate()).toBe(1);
      process.env.TZ = tz;
      expect(localDate(new Date("2026-11-01T14:59:59Z"))).toBe("2026-11-01");
      expect(localDate(new Date("2026-11-01T15:00:00Z"))).toBe("2026-11-02");
      expect(localDate(new Date("2026-11-01T06:30:00Z"))).toBe("2026-11-01");
    });
  }
});

describe("addDays", () => {
  it("달·해를 넘긴다", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("윤년 2월", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
  });

  it("음수면 뺀다", () => {
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
    expect(addDays("2026-11-01", 0)).toBe("2026-11-01");
  });
});

describe("diffDays", () => {
  it("일수 차이", () => {
    expect(diffDays("2026-11-01", "2026-11-01")).toBe(0);
    expect(diffDays("2026-11-01", "2026-11-08")).toBe(7);
    expect(diffDays("2026-11-08", "2026-11-01")).toBe(-7);
    expect(diffDays("2026-12-25", "2027-01-05")).toBe(11);
    expect(diffDays("2028-02-28", "2028-03-01")).toBe(2);
  });
});

describe("weekdayOf", () => {
  it("0 = 일요일", () => {
    expect(weekdayOf("2026-11-01")).toBe(0);
    expect(weekdayOf("2026-11-07")).toBe(6);
  });
});

describe("localDateSchema", () => {
  it("형식과 실제 날짜를 확인한다", () => {
    expect(localDateSchema.safeParse("2026-11-01").success).toBe(true);
    expect(localDateSchema.safeParse("2028-02-29").success).toBe(true);
    expect(localDateSchema.safeParse("2026-2-1").success).toBe(false);
    expect(localDateSchema.safeParse("2026-02-30").success).toBe(false);
    expect(localDateSchema.safeParse("2027-02-29").success).toBe(false);
    expect(localDateSchema.safeParse("2026-11-01T00:00").success).toBe(false);
  });
});

describe("monthOf", () => {
  it("1 = 1월, 12 = 12월", () => {
    expect(monthOf("2026-01-31")).toBe(1);
    expect(monthOf("2026-12-01")).toBe(12);
  });
});
