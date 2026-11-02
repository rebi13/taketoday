import { describe, expect, it } from "vitest";
import {
  canEditMission,
  isCycleDays,
  pickBrowsableTemplates,
} from "./missions";

describe("isCycleDays", () => {
  it("1일부터 365일까지의 정수만 받는다", () => {
    expect(isCycleDays(1)).toBe(true);
    expect(isCycleDays(14)).toBe(true);
    expect(isCycleDays(365)).toBe(true);
    expect(isCycleDays(0)).toBe(false);
    expect(isCycleDays(-3)).toBe(false);
    expect(isCycleDays(366)).toBe(false);
    expect(isCycleDays(1.5)).toBe(false);
    expect(isCycleDays(Number.NaN)).toBe(false);
  });
});

describe("canEditMission", () => {
  const list = { ownerType: "user" as const, ownerId: "me" };

  it("내 리스트의 지우지 않은 미션만 고칠 수 있다", () => {
    expect(canEditMission({ deletedAt: null, list }, { userId: "me" })).toBe(
      true,
    );
  });

  it("다른 사람의 미션은 고칠 수 없다", () => {
    expect(canEditMission({ deletedAt: null, list }, { userId: "other" })).toBe(
      false,
    );
  });

  it("지운 미션은 고칠 수 없다", () => {
    expect(
      canEditMission({ deletedAt: new Date(), list }, { userId: "me" }),
    ).toBe(false);
  });
});

describe("pickBrowsableTemplates", () => {
  const templates = [{ id: "desk-01" }, { id: "desk-02" }, { id: "bath-01" }];

  it("리스트에 있는 기본 미션은 켜져 있든 꺼져 있든 뺀다", () => {
    const picked = pickBrowsableTemplates(templates, [
      { templateId: "desk-01", deletedAt: null },
      { templateId: null, deletedAt: null }, // 직접 만든 미션
    ]);
    expect(picked.map((t) => t.id)).toEqual(["desk-02", "bath-01"]);
  });

  it("지운 기본 미션은 다시 켤 수 있게 보여준다", () => {
    const picked = pickBrowsableTemplates(templates, [
      { templateId: "desk-01", deletedAt: new Date() },
    ]);
    expect(picked.map((t) => t.id)).toEqual(["desk-01", "desk-02", "bath-01"]);
  });
});
