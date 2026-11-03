import { describe, expect, it } from "vitest";
import { criteriaHints } from "./criteria-hints";

describe("criteriaHints", () => {
  it("행동으로 쓰고 '면 완료'로 끝나면 안내하지 않는다", () => {
    expect(
      criteriaHints(
        "수세미로 세면대 테두리와 수도꼭지 주변을 한 바퀴 닦으면 완료",
      ),
    ).toEqual([]);
  });

  it("개수 기준('하나도 없으면')은 상태 문장으로 보지 않는다", () => {
    expect(
      criteriaHints("책상 위에 다 마신 컵이 하나도 남아 있지 않으면 완료"),
    ).toEqual([]);
  });

  it("정도를 판단하는 상태 문장을 알려준다", () => {
    expect(criteriaHints("세면대에 물때가 보이지 않으면 완료")).toEqual([
      "state",
    ]);
  });

  it("끝나는 지점이 없으면 알려준다", () => {
    expect(criteriaHints("세면대 닦기")).toEqual(["ending"]);
  });

  it("빈 칸에는 안내하지 않는다", () => {
    expect(criteriaHints("  ")).toEqual([]);
  });
});
