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
