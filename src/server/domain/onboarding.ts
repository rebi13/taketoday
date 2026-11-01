import "server-only";

// 온보딩에서 다음에 보여줄 단계를 정한다(screen-flow "가입과 온보딩").
// S02 약관 → S04 캐릭터 → S05·S07 생활 정보·알림(#14) → 완료.
// 단계가 생기면 순서대로 여기에 끼워 넣는다.

export type OnboardingStep = "terms" | "character" | "done";

export type OnboardingState = {
  termsAgreedAt: Date | null;
  termsVersion: string | null;
  hasCharacter: boolean;
};

export function nextOnboardingStep(
  state: OnboardingState,
  currentTermsVersion: string,
): OnboardingStep {
  // 약관이 바뀌면 이전 버전에 동의한 사용자도 다시 동의한다
  if (!state.termsAgreedAt || state.termsVersion !== currentTermsVersion) {
    return "terms";
  }
  if (!state.hasCharacter) return "character";
  return "done";
}

/** 단계별 화면 주소 */
export const ONBOARDING_PATHS: Record<
  Exclude<OnboardingStep, "done">,
  string
> = {
  terms: "/onboarding/terms",
  character: "/onboarding/character",
};

// ── 캐릭터 이름 (S04) ──

export type CharacterNameResult =
  | { ok: true; name: string }
  | { ok: false; reason: "empty" | "too-long" | "invalid-char" };

/**
 * 앞뒤 공백을 지우고 가운데 연속 공백을 하나로 줄인 뒤 길이를 센다.
 * 길이는 DB의 char_length와 같은 기준(코드 포인트)으로 센다.
 * 줄바꿈·탭 같은 제어 문자는 받지 않는다.
 */
export function normalizeCharacterName(
  raw: string,
  maxLength: number,
): CharacterNameResult {
  const name = raw.trim().replace(/ {2,}/g, " ");
  if (!name) return { ok: false, reason: "empty" };
  // eslint-disable-next-line no-control-regex -- 제어 문자를 찾는 것이 목적이다
  if (/[\u0000-\u001f\u007f]/.test(name)) {
    return { ok: false, reason: "invalid-char" };
  }
  if ([...name].length > maxLength) return { ok: false, reason: "too-long" };
  return { ok: true, name };
}
