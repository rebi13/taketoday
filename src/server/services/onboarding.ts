import "server-only";
import { randomInt } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  characters,
  characterTypes,
  getDb,
  isUniqueViolation,
  missionLists,
  missions,
  missionTemplates,
  userRestDays,
  users,
  zones,
} from "@/server/db";
import {
  generateNickname,
  isNotifyTime,
  nextOnboardingStep,
  normalizeRestDays,
  pickStartingTemplates,
  normalizeName,
  ONBOARDING_PATHS,
  type OnboardingState,
  type OnboardingStep,
} from "@/server/domain";
import {
  CHARACTER_NAME_MAX_LENGTH,
  CONDITION_TAGS,
  HOUSEHOLDS,
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

/**
 * S02 약관 동의. 동의 시각과 약관 버전을 남기고 다음 화면을 알려준다.
 * 닉네임이 없으면 이때 랜덤으로 준다(#57). 겹치면 다시 뽑는다
 */
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

  for (let attempt = 1; ; attempt++) {
    const nickname = state.nickname ?? generateNickname(randomInt);
    try {
      await getDb()
        .update(users)
        .set({ ...agreed, nickname })
        .where(eq(users.id, user.id));
      break;
    } catch (error) {
      const retry =
        !state.nickname &&
        attempt < NICKNAME_ATTEMPTS &&
        isUniqueViolation(error, "users_nickname_unique");
      if (!retry) throw error;
    }
  }
  return { ok: true, next: next ?? "/" };
}

/** 400만 가지 중 겹칠 확률은 아주 낮다. 그래도 겹치면 몇 번 다시 뽑는다 */
const NICKNAME_ATTEMPTS = 5;

async function readOnboardingState(
  userId: string,
): Promise<(OnboardingState & { nickname: string | null }) | null> {
  // sql 템플릿 안의 컬럼은 테이블 이름 없이 나가 서브쿼리에서 다른 테이블의 id로 해석된다.
  // 그래서 exists 대신 left join으로 읽는다
  const [row] = await getDb()
    .select({
      termsAgreedAt: users.termsAgreedAt,
      termsVersion: users.termsVersion,
      nickname: users.nickname,
      household: users.household,
      onboardedAt: users.onboardedAt,
      characterId: characters.id,
    })
    .from(users)
    .leftJoin(characters, eq(characters.userId, users.id))
    .where(eq(users.id, userId));
  if (!row) return null;
  return {
    termsAgreedAt: row.termsAgreedAt,
    termsVersion: row.termsVersion,
    nickname: row.nickname,
    hasCharacter: row.characterId !== null,
    household: row.household,
    onboardedAt: row.onboardedAt,
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
      reason:
        | "login"
        | "invalid"
        | "empty"
        | "too-short"
        | "too-long"
        | "invalid-char";
    };

/** S04 캐릭터를 고르고 이름을 짓는다. 다시 보내면 고른 것을 바꾼다 */
export async function chooseCharacter(
  input: unknown,
): Promise<ChooseCharacterResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "login" };
  const parsed = chooseCharacterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const name = normalizeName(parsed.data.name, {
    minLength: 1,
    maxLength: CHARACTER_NAME_MAX_LENGTH,
  });
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

// ── S05 생활 정보 ──

export type StartingMissionCandidate = {
  id: string;
  name: string;
  zoneName: string;
  conditionTags: string[];
};

/**
 * 처음에 켜질 수 있는 미션(기본 켬 전부). 화면이 고른 조건으로 걸러 미리 보여준다.
 * 실제로 켜는 것은 finishOnboarding이 같은 규칙(pickStartingTemplates)으로 정한다
 */
export async function listStartingMissionCandidates(): Promise<
  StartingMissionCandidate[]
> {
  return getDb()
    .select({
      id: missionTemplates.id,
      name: missionTemplates.name,
      zoneName: zones.name,
      conditionTags: missionTemplates.conditionTags,
    })
    .from(missionTemplates)
    .innerJoin(zones, eq(zones.id, missionTemplates.zoneId))
    .where(eq(missionTemplates.defaultOn, true))
    .orderBy(asc(zones.sortOrder), asc(missionTemplates.id));
}

const lifeInfoSchema = z.object({
  household: z.enum(HOUSEHOLDS),
  conditionTags: z.array(z.enum(CONDITION_TAGS)),
});

export type SaveLifeInfoResult =
  { ok: true; next: string } | { ok: false; reason: "login" | "invalid" };

/** S05 거주 형태와 조건 태그 저장 */
export async function saveLifeInfo(
  input: unknown,
): Promise<SaveLifeInfoResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "login" };
  const parsed = lifeInfoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const { household, conditionTags } = parsed.data;

  const state = await readOnboardingState(user.id);
  if (!state) return { ok: false, reason: "login" };
  const next = stepPath(
    nextOnboardingStep({ ...state, household }, TERMS_VERSION),
  );

  await getDb()
    .update(users)
    .set({ household, conditionTags: [...new Set(conditionTags)] })
    .where(eq(users.id, user.id));
  return { ok: true, next: next ?? "/" };
}

// ── S07 알림 시간·쉬는 날 → 온보딩 마치기 ──

const finishSchema = z.object({
  notifyTime: z.string(),
  restDays: z.array(z.number()),
});

export type FinishOnboardingResult =
  | { ok: true; missionsTurnedOn: number }
  | { ok: false; reason: "login" | "invalid" | "not-ready" };

/**
 * S07 알림 시간·쉬는 날을 저장하고, 고른 조건에 맞는 기본 미션을 켜서 온보딩을 마친다.
 * 한 트랜잭션: 읽기(사용자·기본 미션) → 켤 미션 계산 → 리스트·미션·쉬는 날·완료 표시 쓰기.
 * 알림 예약 자체는 M5(#34)에서 붙인다
 */
export async function finishOnboarding(
  input: unknown,
): Promise<FinishOnboardingResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "login" };
  const parsed = finishSchema.safeParse(input);
  if (!parsed.success || !isNotifyTime(parsed.data.notifyTime)) {
    return { ok: false, reason: "invalid" };
  }
  const restDays = normalizeRestDays(parsed.data.restDays);
  if (!restDays) return { ok: false, reason: "invalid" };

  return getDb().transaction(async (tx) => {
    const [me] = await tx
      .select({
        conditionTags: users.conditionTags,
        household: users.household,
        onboardedAt: users.onboardedAt,
      })
      .from(users)
      .where(eq(users.id, user.id));
    if (!me) return { ok: false, reason: "login" } as const;
    // S05를 건너뛰고 들어온 요청은 받지 않는다. 이미 마쳤으면 다시 켜지 않는다
    if (!me.household || me.onboardedAt) {
      return { ok: false, reason: "not-ready" } as const;
    }

    const templates = await tx
      .select({
        id: missionTemplates.id,
        defaultOn: missionTemplates.defaultOn,
        conditionTags: missionTemplates.conditionTags,
        name: missionTemplates.name,
        zoneId: missionTemplates.zoneId,
        checkCriteria: missionTemplates.checkCriteria,
        cycleDays: missionTemplates.cycleDays,
        version: missionTemplates.version,
      })
      .from(missionTemplates);
    const picked = pickStartingTemplates(templates, me.conditionTags);

    // 개인 리스트는 사용자당 하나. 이미 있으면 그것을 쓴다
    await tx
      .insert(missionLists)
      .values({ ownerType: "user", ownerId: user.id })
      .onConflictDoNothing();
    const [list] = await tx
      .select({ id: missionLists.id })
      .from(missionLists)
      .where(
        and(
          eq(missionLists.ownerType, "user"),
          eq(missionLists.ownerId, user.id),
        ),
      );

    if (picked.length > 0) {
      await tx
        .insert(missions)
        .values(
          picked.map((t) => ({
            listId: list.id,
            templateId: t.id,
            templateVersion: t.version,
            kind: "recurring" as const,
            name: t.name,
            zoneId: t.zoneId,
            checkCriteria: t.checkCriteria,
            cycleDays: t.cycleDays,
          })),
        )
        // 같은 기본 미션이 이미 켜져 있으면 건너뛴다(부분 유니크 인덱스)
        .onConflictDoNothing();
    }

    await tx.delete(userRestDays).where(eq(userRestDays.userId, user.id));
    if (restDays.length > 0) {
      await tx
        .insert(userRestDays)
        .values(restDays.map((weekday) => ({ userId: user.id, weekday })));
    }
    await tx
      .update(users)
      .set({ notifyTime: parsed.data.notifyTime, onboardedAt: new Date() })
      .where(eq(users.id, user.id));

    return { ok: true, missionsTurnedOn: picked.length } as const;
  });
}
