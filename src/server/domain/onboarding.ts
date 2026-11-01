import "server-only";

// 온보딩에서 다음에 보여줄 단계를 정한다(screen-flow "가입과 온보딩").
// S02 약관 → S04 캐릭터(#13) → S05·S07 생활 정보·알림(#14) → 완료.
// 지금은 약관 단계만 있다. 단계가 생기면 순서대로 여기에 끼워 넣는다.

export type OnboardingStep = "terms" | "done";

export type OnboardingState = {
  termsAgreedAt: Date | null;
  termsVersion: string | null;
};

export function nextOnboardingStep(
  state: OnboardingState,
  currentTermsVersion: string,
): OnboardingStep {
  // 약관이 바뀌면 이전 버전에 동의한 사용자도 다시 동의한다
  if (!state.termsAgreedAt || state.termsVersion !== currentTermsVersion) {
    return "terms";
  }
  return "done";
}

/** 단계별 화면 주소 */
export const ONBOARDING_PATHS: Record<
  Exclude<OnboardingStep, "done">,
  string
> = {
  terms: "/onboarding/terms",
};
