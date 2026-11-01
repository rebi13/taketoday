import { describe, expect, it } from "vitest";
import { nextOnboardingStep, normalizeCharacterName } from "./onboarding";

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

describe("normalizeCharacterName", () => {
  const MAX = 10;

  it("앞뒤 공백을 지우고 가운데 연속 공백을 하나로", () => {
    expect(normalizeCharacterName("  먼지   토끼 ", MAX)).toEqual({
      ok: true,
      name: "먼지 토끼",
    });
  });

  it("비어 있거나 공백뿐이면 거절", () => {
    expect(normalizeCharacterName("", MAX)).toEqual({
      ok: false,
      reason: "empty",
    });
    expect(normalizeCharacterName("   ", MAX)).toMatchObject({ ok: false });
  });

  it("최대 길이까지는 받고 넘으면 거절", () => {
    expect(normalizeCharacterName("가".repeat(10), MAX).ok).toBe(true);
    expect(normalizeCharacterName("가".repeat(11), MAX)).toEqual({
      ok: false,
      reason: "too-long",
    });
  });

  it("이모지는 DB와 같게 코드 포인트로 센다", () => {
    // "🐰"는 UTF-16으로 2칸이지만 코드 포인트로는 1자다
    expect(normalizeCharacterName("🐰".repeat(10), MAX).ok).toBe(true);
  });

  it("가운데 줄바꿈·탭은 거절", () => {
    expect(normalizeCharacterName("먼지\n토끼", MAX)).toEqual({
      ok: false,
      reason: "invalid-char",
    });
    expect(normalizeCharacterName("먼지\t토끼", MAX).ok).toBe(false);
  });
});
