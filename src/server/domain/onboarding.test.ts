import { describe, expect, it } from "vitest";
import { nextOnboardingStep } from "./onboarding";

const VERSION = "2026-11-01";
const agreed = { termsAgreedAt: new Date(), termsVersion: VERSION };

describe("nextOnboardingStep", () => {
  it("처음 가입하면 약관 동의부터", () => {
    expect(
      nextOnboardingStep(
        { termsAgreedAt: null, termsVersion: null, hasCharacter: false },
        VERSION,
      ),
    ).toBe("terms");
  });

  it("약관에 동의했으면 캐릭터 고르기", () => {
    expect(
      nextOnboardingStep({ ...agreed, hasCharacter: false }, VERSION),
    ).toBe("character");
  });

  it("캐릭터까지 골랐으면 완료", () => {
    expect(nextOnboardingStep({ ...agreed, hasCharacter: true }, VERSION)).toBe(
      "done",
    );
  });

  it("약관이 바뀌었으면 캐릭터가 있어도 다시 동의받는다", () => {
    expect(
      nextOnboardingStep(
        { ...agreed, termsVersion: "2026-10-01", hasCharacter: true },
        VERSION,
      ),
    ).toBe("terms");
  });
});
