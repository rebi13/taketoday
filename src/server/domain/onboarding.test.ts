import { describe, expect, it } from "vitest";
import { nextOnboardingStep } from "./onboarding";

const VERSION = "2026-11-01";

describe("nextOnboardingStep", () => {
  it("처음 가입하면 약관 동의부터", () => {
    expect(
      nextOnboardingStep({ termsAgreedAt: null, termsVersion: null }, VERSION),
    ).toBe("terms");
  });

  it("지금 버전에 동의했으면 다음 단계로", () => {
    expect(
      nextOnboardingStep(
        { termsAgreedAt: new Date(), termsVersion: VERSION },
        VERSION,
      ),
    ).toBe("done");
  });

  it("약관이 바뀌었으면 다시 동의받는다", () => {
    expect(
      nextOnboardingStep(
        { termsAgreedAt: new Date(), termsVersion: "2026-10-01" },
        VERSION,
      ),
    ).toBe("terms");
  });
});
