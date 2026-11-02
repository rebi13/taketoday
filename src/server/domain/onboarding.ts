import "server-only";

// 온보딩에서 다음에 보여줄 단계를 정한다(screen-flow "가입과 온보딩").
// S02 약관 → S04 캐릭터 → S05 생활 정보 → S07 알림 시간·쉬는 날 → 완료.
// S08(홈 화면 추가·알림 허용)은 첫 완료 직후(M5), S09 시작 선물은 M4.

export type OnboardingStep = "terms" | "character" | "life" | "notify" | "done";

export type OnboardingState = {
  termsAgreedAt: Date | null;
  termsVersion: string | null;
  hasCharacter: boolean;
  /** S05에서 정한다. 있으면 S05를 마친 것이다 */
  household: "solo" | "shared" | null;
  /** S07을 마치면 찍는다 */
  onboardedAt: Date | null;
};

export function nextOnboardingStep(
  state: OnboardingState,
  currentTermsVersion: string,
): OnboardingStep {
  // 약관이 바뀌면 이전 버전에 동의한 사용자도 다시 동의한다
  if (!state.termsAgreedAt || state.termsVersion !== currentTermsVersion) {
    return "terms";
  }
  // 온보딩을 이미 마친 사용자는 캐릭터·생활 정보를 다시 묻지 않는다
  if (state.onboardedAt) return "done";
  if (!state.hasCharacter) return "character";
  if (!state.household) return "life";
  return "notify";
}

/** 단계별 화면 주소 */
export const ONBOARDING_PATHS: Record<
  Exclude<OnboardingStep, "done">,
  string
> = {
  terms: "/onboarding/terms",
  character: "/onboarding/character",
  life: "/onboarding/life",
  notify: "/onboarding/notify",
};

// ── 처음 켤 미션 (기획서 8.6) ──

export type StartingTemplate = {
  id: string;
  defaultOn: boolean;
  conditionTags: readonly string[];
};

/**
 * 온보딩을 마칠 때 켤 기본 미션.
 * `기본`(defaultOn) 미션 중 조건이 없는 것과, 조건이 모두 사용자가 고른 것에 드는 것.
 * 조건 미션 전부를 켜지는 않는다(드문 미션까지 켜지면 처음부터 부담이 크다).
 * 화면의 미리보기(features/save-life-info)도 같은 규칙으로 센다.
 */
export function pickStartingTemplates<T extends StartingTemplate>(
  templates: readonly T[],
  chosenTags: readonly string[],
): T[] {
  const chosen = new Set(chosenTags);
  return templates.filter(
    (t) => t.defaultOn && t.conditionTags.every((tag) => chosen.has(tag)),
  );
}

// ── 알림 시간·쉬는 날 (S07) ──

/** "HH:mm" 24시간제. 서울 기준 */
export function isNotifyTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** 쉬는 날 요일(0 = 일요일)을 정리한다. 범위를 벗어나면 null */
export function normalizeRestDays(days: readonly number[]): number[] | null {
  if (days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) return null;
  return [...new Set(days)].sort((a, b) => a - b);
}
