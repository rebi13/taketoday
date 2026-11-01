import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, users } from "@/server/db";
import {
  nextOnboardingStep,
  ONBOARDING_PATHS,
  type OnboardingState,
  type OnboardingStep,
} from "@/server/domain";
import { TERMS_VERSION } from "@/shared/config/constants";
import { getSessionUser, type SessionUser } from "./session";

export type AppEntry =
  | { kind: "login" }
  | { kind: "onboarding"; path: string }
  | { kind: "ready"; user: SessionUser };

/** 지금 사용자가 어디로 가야 하는가: 로그인 → 온보딩 남은 단계 → 앱 */
export async function getAppEntry(): Promise<AppEntry> {
  const user = await getSessionUser();
  if (!user) return { kind: "login" };
  const state = await readOnboardingState(user.id);
  // 세션은 있는데 사용자 행이 없으면(삭제 등) 다시 로그인
  if (!state) return { kind: "login" };

  const path = stepPath(nextOnboardingStep(state, TERMS_VERSION));
  return path ? { kind: "onboarding", path } : { kind: "ready", user };
}

// 세 항목 모두 필수다. 만 14세 미만은 받지 않는다(기획서 17.1)
const termsAgreementSchema = z.object({
  terms: z.literal(true),
  privacy: z.literal(true),
  over14: z.literal(true),
});

export type AgreeToTermsResult =
  { ok: true; next: string } | { ok: false; reason: "login" | "invalid" };

/** S02 약관 동의. 동의 시각과 약관 버전을 남기고 다음 화면을 알려준다 */
export async function agreeToTerms(
  input: unknown,
): Promise<AgreeToTermsResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "login" };
  if (!termsAgreementSchema.safeParse(input).success) {
    return { ok: false, reason: "invalid" };
  }

  // 읽기 → 동의한 뒤의 상태로 다음 단계 계산 → 한 번에 쓰기
  const state = await readOnboardingState(user.id);
  if (!state) return { ok: false, reason: "login" };
  const agreed = { termsAgreedAt: new Date(), termsVersion: TERMS_VERSION };
  const next = stepPath(
    nextOnboardingStep({ ...state, ...agreed }, TERMS_VERSION),
  );

  await getDb().update(users).set(agreed).where(eq(users.id, user.id));
  return { ok: true, next: next ?? "/" };
}

async function readOnboardingState(
  userId: string,
): Promise<OnboardingState | null> {
  const [row] = await getDb()
    .select({
      termsAgreedAt: users.termsAgreedAt,
      termsVersion: users.termsVersion,
    })
    .from(users)
    .where(eq(users.id, userId));
  return row ?? null;
}

function stepPath(step: OnboardingStep): string | null {
  return step === "done" ? null : ONBOARDING_PATHS[step];
}
