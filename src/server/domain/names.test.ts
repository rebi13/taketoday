import { describe, expect, it } from "vitest";
import {
  generateNickname,
  NICKNAME_ADJECTIVES,
  NICKNAME_NOUNS,
  normalizeName,
} from "./names";
import { NICKNAME_MAX_LENGTH } from "@/shared/config/constants";

describe("normalizeName", () => {
  const limits = { minLength: 1, maxLength: 10 };

  it("앞뒤 공백을 지우고 가운데 연속 공백을 하나로", () => {
    expect(normalizeName("  먼지   토끼 ", limits)).toEqual({
      ok: true,
      name: "먼지 토끼",
    });
  });

  it("비어 있거나 공백뿐이면 거절", () => {
    expect(normalizeName("", limits)).toEqual({ ok: false, reason: "empty" });
    expect(normalizeName("   ", limits)).toEqual({
      ok: false,
      reason: "empty",
    });
  });

  it("최소·최대 길이", () => {
    const nickname = { minLength: 2, maxLength: 12 };
    expect(normalizeName("가", nickname)).toEqual({
      ok: false,
      reason: "too-short",
    });
    expect(normalizeName("가나", nickname).ok).toBe(true);
    expect(normalizeName("가".repeat(12), nickname).ok).toBe(true);
    expect(normalizeName("가".repeat(13), nickname)).toEqual({
      ok: false,
      reason: "too-long",
    });
  });

  it("이모지는 DB와 같게 코드 포인트로 센다", () => {
    // "🐰"는 UTF-16으로 2칸이지만 코드 포인트로는 1자다
    expect(normalizeName("🐰".repeat(10), limits).ok).toBe(true);
  });

  it("가운데 줄바꿈·탭은 거절", () => {
    expect(normalizeName("먼지\n토끼", limits)).toEqual({
      ok: false,
      reason: "invalid-char",
    });
    expect(normalizeName("먼지\t토끼", limits).ok).toBe(false);
  });
});

describe("generateNickname", () => {
  it("형용사 + 명사 + 숫자 4자리", () => {
    const picks = [0, 2, 582];
    expect(generateNickname(() => picks.shift()!)).toBe("포근한고양이0582");
  });

  it("숫자는 앞자리 0을 채워 항상 4자리", () => {
    expect(generateNickname(() => 0)).toMatch(/^포근한먼지0000$/);
    expect(generateNickname((max) => max - 1).endsWith("9999")).toBe(true);
  });

  it("어떤 조합도 닉네임 최대 길이 안에 들어간다", () => {
    const longest =
      Math.max(...NICKNAME_ADJECTIVES.map((w) => [...w].length)) +
      Math.max(...NICKNAME_NOUNS.map((w) => [...w].length)) +
      4;
    expect(longest).toBeLessThanOrEqual(NICKNAME_MAX_LENGTH);
  });

  it("단어 목록에 중복이 없다", () => {
    expect(new Set(NICKNAME_ADJECTIVES).size).toBe(NICKNAME_ADJECTIVES.length);
    expect(new Set(NICKNAME_NOUNS).size).toBe(NICKNAME_NOUNS.length);
  });
});
