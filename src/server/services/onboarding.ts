import "server-only";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { characters, characterTypes, getDb, users } from "@/server/db";
import {
  nextOnboardingStep,
  normalizeCharacterName,
  ONBOARDING_PATHS,
  type OnboardingState,
  type OnboardingStep,
} from "@/server/domain";
import {
  CHARACTER_NAME_MAX_LENGTH,
  TERMS_VERSION,
} from "@/shared/config/constants";
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
  // sql 템플릿 안의 컬럼은 테이블 이름 없이 나가 서브쿼리에서 다른 테이블의 id로 해석된다.
  // 그래서 exists 대신 left join으로 읽는다
  const [row] = await getDb()
    .select({
      termsAgreedAt: users.termsAgreedAt,
      termsVersion: users.termsVersion,
      characterId: characters.id,
    })
    .from(users)
    .leftJoin(characters, eq(characters.userId, users.id))
    .where(eq(users.id, userId));
  if (!row) return null;
  return {
    termsAgreedAt: row.termsAgreedAt,
    termsVersion: row.termsVersion,
    hasCharacter: row.characterId !== null,
  };
}

function stepPath(step: OnboardingStep): string | null {
  return step === "done" ? null : ONBOARDING_PATHS[step];
}

// ── S04 캐릭터 고르기 ──

export type CharacterTypeOption = { id: string; name: string };

/** 고를 수 있는 캐릭터 종류(시드 순서) */
export async function listCharacterTypes(): Promise<CharacterTypeOption[]> {
  return getDb()
    .select({ id: characterTypes.id, name: characterTypes.name })
    .from(characterTypes)
    .orderBy(asc(characterTypes.sortOrder));
}

const chooseCharacterSchema = z.object({
  characterTypeId: z.string().min(1),
  name: z.string(),
});

export type ChooseCharacterResult =
  | { ok: true; next: string }
  | {
      ok: false;
      reason: "login" | "invalid" | "empty" | "too-long" | "invalid-char";
    };

/** S04 캐릭터를 고르고 이름을 짓는다. 다시 보내면 고른 것을 바꾼다 */
export async function chooseCharacter(
  input: unknown,
): Promise<ChooseCharacterResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "login" };
  const parsed = chooseCharacterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const name = normalizeCharacterName(
    parsed.data.name,
    CHARACTER_NAME_MAX_LENGTH,
  );
  if (!name.ok) return { ok: false, reason: name.reason };

  // 읽기 → 고른 뒤의 상태로 다음 단계 계산 → 한 번에 쓰기
  const [state, [type]] = await Promise.all([
    readOnboardingState(user.id),
    getDb()
      .select({ id: characterTypes.id })
      .from(characterTypes)
      .where(eq(characterTypes.id, parsed.data.characterTypeId)),
  ]);
  if (!state) return { ok: false, reason: "login" };
  if (!type) return { ok: false, reason: "invalid" };
  const next = stepPath(
    nextOnboardingStep({ ...state, hasCharacter: true }, TERMS_VERSION),
  );

  await getDb()
    .insert(characters)
    .values({ userId: user.id, characterTypeId: type.id, name: name.name })
    .onConflictDoUpdate({
      target: characters.userId,
      set: { characterTypeId: type.id, name: name.name },
    });
  return { ok: true, next: next ?? "/" };
}
