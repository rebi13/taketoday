import { describe, expect, it } from "vitest";
import {
  describeCycle,
  describeDate,
  describeDue,
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
