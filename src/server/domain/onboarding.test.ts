import { describe, expect, it } from "vitest";
import {
  isNotifyTime,
  nextOnboardingStep,
  normalizeRestDays,
  pickStartingTemplates,
  type OnboardingState,
} from "./onboarding";

const VERSION = "2026-11-01";
const fresh: OnboardingState = {
  termsAgreedAt: null,
  termsVersion: null,
  hasCharacter: false,
  household: null,
  onboardedAt: null,
};
const agreed = { termsAgreedAt: new Date(), termsVersion: VERSION };

describe("nextOnboardingStep", () => {
  it("약관 → 캐릭터 → 생활 정보 → 알림 → 완료", () => {
    expect(nextOnboardingStep(fresh, VERSION)).toBe("terms");
    let state: OnboardingState = { ...fresh, ...agreed };
    expect(nextOnboardingStep(state, VERSION)).toBe("character");
    state = { ...state, hasCharacter: true };
    expect(nextOnboardingStep(state, VERSION)).toBe("life");
    state = { ...state, household: "solo" };
    expect(nextOnboardingStep(state, VERSION)).toBe("notify");
    state = { ...state, onboardedAt: new Date() };
    expect(nextOnboardingStep(state, VERSION)).toBe("done");
  });

  it("약관이 바뀌면 온보딩을 마쳤어도 다시 동의받는다", () => {
    const done: OnboardingState = {
      termsAgreedAt: new Date(),
      termsVersion: "2026-10-01",
      hasCharacter: true,
      household: "shared",
      onboardedAt: new Date(),
    };
    expect(nextOnboardingStep(done, VERSION)).toBe("terms");
  });

  it("온보딩을 마친 사용자는 앞 단계를 다시 묻지 않는다", () => {
    // 예: 온보딩 뒤에 캐릭터 행이 사라진 경우에도 앱으로 보낸다
    expect(
      nextOnboardingStep(
        { ...fresh, ...agreed, onboardedAt: new Date() },
        VERSION,
      ),
    ).toBe("done");
  });
});

describe("pickStartingTemplates", () => {
  const t = (id: string, defaultOn: boolean, conditionTags: string[] = []) => ({
    id,
    defaultOn,
    conditionTags,
  });
  const templates = [
    t("desk-01", true),
    t("desk-04", false),
    t("pet-01", true, ["pet"]),
    t("pet-02", false, ["pet"]),
    t("car-01", true, ["car"]),
  ];
  const ids = (chosen: string[]) =>
    pickStartingTemplates(templates, chosen).map((x) => x.id);

  it("조건을 고르지 않으면 조건 없는 기본 미션만", () => {
    expect(ids([])).toEqual(["desk-01"]);
  });

  it("고른 조건의 기본 미션만 더한다(기본이 아닌 조건 미션은 켜지 않음)", () => {
    expect(ids(["pet"])).toEqual(["desk-01", "pet-01"]);
    expect(ids(["pet", "car"])).toEqual(["desk-01", "pet-01", "car-01"]);
  });

  it("고르지 않은 조건의 미션은 기본이어도 켜지 않는다", () => {
    expect(ids(["car"])).not.toContain("pet-01");
  });
});

describe("isNotifyTime", () => {
  it("HH:mm 24시간제만", () => {
    expect(isNotifyTime("08:00")).toBe(true);
    expect(isNotifyTime("23:59")).toBe(true);
    expect(isNotifyTime("00:00")).toBe(true);
    expect(isNotifyTime("24:00")).toBe(false);
    expect(isNotifyTime("8:00")).toBe(false);
    expect(isNotifyTime("08:60")).toBe(false);
    expect(isNotifyTime("08:00:00")).toBe(false);
  });
});

describe("normalizeRestDays", () => {
  it("중복을 없애고 정렬한다", () => {
    expect(normalizeRestDays([6, 0, 6])).toEqual([0, 6]);
    expect(normalizeRestDays([])).toEqual([]);
  });

  it("0~6 밖이거나 정수가 아니면 null", () => {
    expect(normalizeRestDays([7])).toBeNull();
    expect(normalizeRestDays([-1])).toBeNull();
    expect(normalizeRestDays([1.5])).toBeNull();
  });
});
