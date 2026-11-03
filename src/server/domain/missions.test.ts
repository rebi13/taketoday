import { describe, expect, it } from "vitest";
import {
  canEditMission,
  isCycleDays,
  normalizeCheckCriteria,
  pickBrowsableTemplates,
  planCriteriaChange,
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

describe("normalizeCheckCriteria", () => {
  it("줄바꿈과 연속 공백을 공백 하나로 줄인다", () => {
    expect(
      normalizeCheckCriteria("  수세미로\n세면대를   한 바퀴 닦으면 완료 ", 80),
    ).toEqual({ ok: true, text: "수세미로 세면대를 한 바퀴 닦으면 완료" });
  });

  it("비어 있거나 길면 받지 않는다", () => {
    expect(normalizeCheckCriteria(" \n ", 80)).toEqual({
      ok: false,
      reason: "empty",
    });
    expect(normalizeCheckCriteria("가".repeat(81), 80)).toEqual({
      ok: false,
      reason: "too-long",
    });
    expect(normalizeCheckCriteria("가".repeat(80), 80).ok).toBe(true);
  });
});

describe("planCriteriaChange", () => {
  const template = {
    name: "세면대 닦기",
    checkCriteria: "수세미로 세면대 테두리를 한 바퀴 닦으면 완료",
    version: 3,
  };

  it("고친 기준은 user_modified로 표시한다", () => {
    expect(
      planCriteriaChange("물티슈로 수도꼭지만 닦으면 완료", template),
    ).toEqual({
      checkCriteria: "물티슈로 수도꼭지만 닦으면 완료",
      userModified: true,
    });
  });

  it("기본 기준과 같으면 다시 기본 미션을 따라가고 이름·버전을 맞춘다", () => {
    expect(planCriteriaChange(template.checkCriteria, template)).toEqual({
      checkCriteria: template.checkCriteria,
      userModified: false,
      name: "세면대 닦기",
      templateVersion: 3,
    });
  });

  it("직접 만든 미션은 기본 기준이 없어 항상 고친 것으로 둔다", () => {
    expect(planCriteriaChange("5분 하면 완료", null)).toEqual({
      checkCriteria: "5분 하면 완료",
      userModified: true,
    });
  });
});
