import { describe, expect, it } from "vitest";
import {
  describeCycle,
  describeDate,
  describeDay,
  describeDaysAgo,
  describeDue,
  isPastDue,
  describeSchedule,
} from "./schedule";

describe("describeSchedule", () => {
  it("주기가 1일이면 매일, 아니면 n일마다", () => {
    expect(describeCycle(1)).toBe("매일");
    expect(describeCycle(14)).toBe("14일마다");
  });

  it("기한형은 마감일을 월·일로", () => {
    expect(describeDue("2026-01-05")).toBe("1월 5일까지");
    expect(describeSchedule({ cycleDays: null, dueDate: "2026-11-10" })).toBe(
      "11월 10일까지",
    );
  });
});

describe("describeDate", () => {
  it("날짜를 월·일로", () => {
    expect(describeDate("2026-11-03")).toBe("11월 3일");
  });
});

describe("describeDay", () => {
  it("날짜와 요일", () => {
    expect(describeDay("2026-11-03")).toBe("11월 3일 (화)");
    expect(describeDay("2026-11-01")).toBe("11월 1일 (일)");
  });
});

describe("describeDaysAgo", () => {
  it("오늘 · 어제 · n일 전", () => {
    expect(describeDaysAgo("2026-11-03", "2026-11-03")).toBe("오늘");
    expect(describeDaysAgo("2026-11-02", "2026-11-03")).toBe("어제");
    expect(describeDaysAgo("2026-10-27", "2026-11-03")).toBe("7일 전");
  });
});

describe("isPastDue", () => {
  it("오늘 마감은 아직, 어제 마감부터 지남", () => {
    expect(isPastDue("2026-11-03", "2026-11-03")).toBe(false);
    expect(isPastDue("2026-11-02", "2026-11-03")).toBe(true);
  });
});
