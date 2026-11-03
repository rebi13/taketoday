import "server-only";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import {
  getDb,
  missionLists,
  missions,
  missionTemplates,
  zones,
} from "@/server/db";
import {
  canEditMission,
  isCycleDays,
  normalizeOneLine,
  pickBrowsableTemplates,
  planCriteriaChange,
  planMissionSchedule,
  type CriteriaPatch,
  type CriteriaTemplate,
  type MissionSchedule,
} from "@/server/domain";
import {
  CHECK_CRITERIA_MAX_LENGTH,
  MISSION_BATCH_MAX,
  MISSION_NAME_MAX_LENGTH,
} from "@/shared/config/constants";
import { localDate } from "@/shared/lib/date";
import { ensurePersonalList, type Tx } from "./lists";
import { lastDoneDateOf } from "./recommendations";
import { getSessionUser } from "./session";

// S11 내 미션 목록과 S15 기본 미션 둘러보기(#15), S12 상세와 완료 기준 바꾸기(#16),
// S13 직접 만들기·수정(#17).

export type MissionZone = { id: string; name: string; icon: string };

export type MyMission = {
  id: string;
  name: string;
  zoneId: string | null;
  kind: "recurring" | "once";
  cycleDays: number | null;
  dueDate: string | null;
  checkCriteria: string;
  active: boolean;
  /** 기본 미션에서 켠 것. 지워도 S15에서 다시 켤 수 있다 */
  fromTemplate: boolean;
};

export type BrowsableTemplate = {
  id: string;
  name: string;
  zoneId: string;
  checkCriteria: string;
  cycleDays: number;
};

export type MissionBoard = {
  /** 구역 순서(시드 order) */
  zones: MissionZone[];
  /** 내 리스트의 지우지 않은 미션. 꺼 둔 것도 들어 있다 */
  mine: MyMission[];
  /** 내 리스트에 아직 없는 기본 미션 */
  browse: BrowsableTemplate[];
};

/** S11·S15 화면 데이터. 로그인이 안 됐으면 null */
export async function getMissionBoard(): Promise<MissionBoard | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const db = getDb();

  const [zoneRows, mine, templates] = await Promise.all([
    db
      .select({ id: zones.id, name: zones.name, icon: zones.icon })
      .from(zones)
      .orderBy(asc(zones.sortOrder)),
    db
      .select({
        id: missions.id,
        name: missions.name,
        zoneId: missions.zoneId,
        kind: missions.kind,
        cycleDays: missions.cycleDays,
        dueDate: missions.dueDate,
        checkCriteria: missions.checkCriteria,
        active: missions.active,
        templateId: missions.templateId,
        deletedAt: missions.deletedAt,
      })
      .from(missions)
      .innerJoin(missionLists, eq(missionLists.id, missions.listId))
      .where(
        and(
          eq(missionLists.ownerType, "user"),
          eq(missionLists.ownerId, user.id),
          isNull(missions.deletedAt),
        ),
      )
      .orderBy(asc(missions.createdAt), asc(missions.id)),
    db
      .select({
        id: missionTemplates.id,
        name: missionTemplates.name,
        zoneId: missionTemplates.zoneId,
        checkCriteria: missionTemplates.checkCriteria,
        cycleDays: missionTemplates.cycleDays,
      })
      .from(missionTemplates)
      .orderBy(asc(missionTemplates.id)),
  ]);

  return {
    zones: zoneRows,
    mine: mine.map((m) => ({
      id: m.id,
      name: m.name,
      zoneId: m.zoneId,
      kind: m.kind,
      cycleDays: m.cycleDays,
      dueDate: m.dueDate,
      checkCriteria: m.checkCriteria,
      active: m.active,
      fromTemplate: m.templateId !== null,
    })),
    browse: pickBrowsableTemplates(templates, mine),
  };
}

export type MissionChangeResult =
  { ok: true } | { ok: false; reason: "login" | "invalid" | "not-found" };

const setActiveSchema = z.object({
  missionIds: z.array(z.uuid()).min(1).max(MISSION_BATCH_MAX),
  active: z.boolean(),
});

/**
 * S11 켜기·끄기. 미션 하나(스위치)나 구역 하나(모두 켜기·끄기)를 한 번에 바꾼다.
 * 꺼 둔 미션은 추천에서 빠지고 목록에는 남는다.
 * 한 트랜잭션: 미션과 리스트 주인 읽기 → 모두 권한 확인 → 한 번에 쓰기.
 * 하나라도 고칠 수 없으면(지웠거나 남의 것) 아무것도 바꾸지 않는다
 */
export async function setMissionsActive(
  input: unknown,
): Promise<MissionChangeResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "login" };
  const parsed = setActiveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const missionIds = [...new Set(parsed.data.missionIds)];
  const { active } = parsed.data;

  return getDb().transaction(async (tx) => {
    const rows = await tx
      .select({
        deletedAt: missions.deletedAt,
        ownerType: missionLists.ownerType,
        ownerId: missionLists.ownerId,
      })
      .from(missions)
      .innerJoin(missionLists, eq(missionLists.id, missions.listId))
      .where(inArray(missions.id, missionIds));
    const editable =
      rows.length === missionIds.length &&
      rows.every((row) =>
        canEditMission(
          {
            deletedAt: row.deletedAt,
            list: { ownerType: row.ownerType, ownerId: row.ownerId },
          },
          { userId: user.id },
        ),
      );
    if (!editable) return { ok: false, reason: "not-found" } as const;

    await tx
      .update(missions)
      .set({ active })
      .where(inArray(missions.id, missionIds));
    return { ok: true } as const;
  });
}

const changeCycleSchema = z.object({
  missionId: z.uuid(),
  cycleDays: z.number(),
});

/** P05 주기 바꾸기. 주기형 미션만 */
export async function changeMissionCycle(
  input: unknown,
): Promise<MissionChangeResult> {
  const parsed = changeCycleSchema.safeParse(input);
  if (!parsed.success || !isCycleDays(parsed.data.cycleDays)) {
    return { ok: false, reason: "invalid" };
  }
  const { missionId, cycleDays } = parsed.data;
  return withoutPatch(
    await changeMission(missionId, (mission) =>
      mission.kind === "recurring" ? { cycleDays } : null,
    ),
  );
}

const deleteSchema = z.object({ missionId: z.uuid() });

/** P06 삭제. 기록과 정산 이력이 참조하므로 지우지 않고 deletedAt만 채운다 */
export async function deleteMission(
  input: unknown,
): Promise<MissionChangeResult> {
  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  return withoutPatch(
    await changeMission(parsed.data.missionId, () => ({
      deletedAt: new Date(),
    })),
  );
}

type MissionPatch = Partial<
  Pick<
    typeof missions.$inferInsert,
    | "cycleDays"
    | "deletedAt"
    | "checkCriteria"
    | "userModified"
    | "name"
    | "templateVersion"
  >
>;

type MissionForPatch = {
  kind: "recurring" | "once";
  /** 기본 미션에서 켰으면 그 템플릿의 지금 문장 */
  template: CriteriaTemplate | null;
};

/**
 * 미션 하나를 고치는 공통 흐름. 한 트랜잭션: 미션과 리스트 주인 읽기 →
 * 권한 확인(canEditMission) → 바꿀 값 계산 → 쓰기.
 * patch가 null을 돌려주면 이 미션에는 맞지 않는 변경이다(invalid)
 */
async function changeMission<P extends MissionPatch>(
  missionId: string,
  patch: (mission: MissionForPatch) => P | null,
): Promise<
  | { ok: true; patch: P }
  | { ok: false; reason: "login" | "invalid" | "not-found" }
> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "login" };

  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .select({
        kind: missions.kind,
        deletedAt: missions.deletedAt,
        ownerType: missionLists.ownerType,
        ownerId: missionLists.ownerId,
        templateName: missionTemplates.name,
        templateCriteria: missionTemplates.checkCriteria,
        templateVersion: missionTemplates.version,
      })
      .from(missions)
      .innerJoin(missionLists, eq(missionLists.id, missions.listId))
      .leftJoin(missionTemplates, eq(missionTemplates.id, missions.templateId))
      .where(eq(missions.id, missionId));
    // 남의 미션은 있는지도 알리지 않는다
    if (
      !row ||
      !canEditMission(
        {
          deletedAt: row.deletedAt,
          list: { ownerType: row.ownerType, ownerId: row.ownerId },
        },
        { userId: user.id },
      )
    ) {
      return { ok: false, reason: "not-found" } as const;
    }

    const values = patch({
      kind: row.kind,
      template:
        row.templateName !== null &&
        row.templateCriteria !== null &&
        row.templateVersion !== null
          ? {
              name: row.templateName,
              checkCriteria: row.templateCriteria,
              version: row.templateVersion,
            }
          : null,
    });
    if (!values) return { ok: false, reason: "invalid" } as const;
    await tx.update(missions).set(values).where(eq(missions.id, missionId));
    return { ok: true, patch: values } as const;
  });
}

/** 화면에는 쓴 값을 돌려주지 않는다 */
function withoutPatch(
  result: Awaited<ReturnType<typeof changeMission>>,
): MissionChangeResult {
  return result.ok ? { ok: true } : result;
}

// ── S12 미션 상세와 완료 기준 바꾸기(#16) ──

export type MissionDetail = {
  id: string;
  name: string;
  zone: MissionZone | null;
  kind: "recurring" | "once";
  cycleDays: number | null;
  dueDate: string | null;
  checkCriteria: string;
  /** 사용자가 완료 기준을 고쳤다 */
  userModified: boolean;
  active: boolean;
  /** 기본 미션에서 켠 것. 직접 만든 미션만 S13에서 고친다 */
  fromTemplate: boolean;
  /** 기본 미션의 지금 기준. 직접 만든 미션이면 null. "기본 기준으로 되돌리기"에 쓴다 */
  templateCriteria: string | null;
  /** 마지막으로 완료한 날(localDate). 한 번도 안 했으면 null */
  lastDoneDate: string | null;
  /** 서울 기준 오늘 */
  today: string;
  /** 오늘 완료했다(S12 오늘 했어요) */
  doneToday: boolean;
};

const detailSchema = z.object({ missionId: z.uuid() });

/** S12 미션 상세. 로그인이 안 됐거나, 없거나, 남의 것이거나, 지운 미션이면 null */
export async function getMissionDetail(
  input: unknown,
): Promise<MissionDetail | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const parsed = detailSchema.safeParse(input);
  if (!parsed.success) return null;
  const today = localDate();

  const [[row], lastDoneDate] = await Promise.all([
    getDb()
      .select({
        id: missions.id,
        name: missions.name,
        kind: missions.kind,
        cycleDays: missions.cycleDays,
        dueDate: missions.dueDate,
        checkCriteria: missions.checkCriteria,
        userModified: missions.userModified,
        active: missions.active,
        deletedAt: missions.deletedAt,
        ownerType: missionLists.ownerType,
        ownerId: missionLists.ownerId,
        zoneId: zones.id,
        zoneName: zones.name,
        zoneIcon: zones.icon,
        templateId: missions.templateId,
        templateCriteria: missionTemplates.checkCriteria,
      })
      .from(missions)
      .innerJoin(missionLists, eq(missionLists.id, missions.listId))
      .leftJoin(zones, eq(zones.id, missions.zoneId))
      .leftJoin(missionTemplates, eq(missionTemplates.id, missions.templateId))
      .where(eq(missions.id, parsed.data.missionId)),
    // 남의 미션이면 아래에서 null을 돌려주므로 내 기록만 본다
    lastDoneDateOf(getDb(), user.id, parsed.data.missionId),
  ]);
  if (
    !row ||
    !canEditMission(
      {
        deletedAt: row.deletedAt,
        list: { ownerType: row.ownerType, ownerId: row.ownerId },
      },
      { userId: user.id },
    )
  ) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    zone:
      row.zoneId !== null && row.zoneName !== null && row.zoneIcon !== null
        ? { id: row.zoneId, name: row.zoneName, icon: row.zoneIcon }
        : null,
    kind: row.kind,
    cycleDays: row.cycleDays,
    dueDate: row.dueDate,
    checkCriteria: row.checkCriteria,
    userModified: row.userModified,
    active: row.active,
    fromTemplate: row.templateId !== null,
    templateCriteria: row.templateCriteria,
    lastDoneDate,
    today,
    doneToday: lastDoneDate === today,
  };
}

export type CriteriaChangeResult =
  | { ok: true; checkCriteria: string; userModified: boolean }
  | {
      ok: false;
      reason: "login" | "invalid" | "not-found" | "empty" | "too-long";
    };

const updateCriteriaSchema = z.object({
  missionId: z.uuid(),
  checkCriteria: z.string(),
});

/**
 * P25 내 기준으로 바꾸기. 고친 기준은 user_modified로 표시해 기본 미션 문장이
 * 바뀌어도 덮어쓰지 않는다. 기본 기준과 같은 문장이면 되돌리기와 같다
 */
export async function updateCheckCriteria(
  input: unknown,
): Promise<CriteriaChangeResult> {
  const parsed = updateCriteriaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const criteria = normalizeOneLine(
    parsed.data.checkCriteria,
    CHECK_CRITERIA_MAX_LENGTH,
  );
  if (!criteria.ok) return { ok: false, reason: criteria.reason };
  return changeCriteria(parsed.data.missionId, (template) =>
    planCriteriaChange(criteria.text, template),
  );
}

const resetCriteriaSchema = z.object({ missionId: z.uuid() });

/** P25 기본 기준으로 되돌리기. 기본 미션에서 켠 미션만 */
export async function resetCheckCriteria(
  input: unknown,
): Promise<CriteriaChangeResult> {
  const parsed = resetCriteriaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  return changeCriteria(parsed.data.missionId, (template) =>
    template ? planCriteriaChange(template.checkCriteria, template) : null,
  );
}

async function changeCriteria(
  missionId: string,
  plan: (template: CriteriaTemplate | null) => CriteriaPatch | null,
): Promise<CriteriaChangeResult> {
  const result = await changeMission(missionId, ({ template }) =>
    plan(template),
  );
  if (!result.ok) return result;
  return {
    ok: true,
    checkCriteria: result.patch.checkCriteria,
    userModified: result.patch.userModified,
  };
}

const turnOnTemplateSchema = z.object({ templateId: z.string().min(1) });

/**
 * S15 기본 미션 켜기. 템플릿의 이름·완료 기준·주기를 복사해 내 리스트에 넣는다.
 * 이미 리스트에 있으면(다른 탭에서 먼저 켰거나 꺼 둔 것) 켜기만 한다
 */
export async function turnOnTemplate(
  input: unknown,
): Promise<MissionChangeResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "login" };
  const parsed = turnOnTemplateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };

  return getDb().transaction(async (tx) => {
    const [template] = await tx
      .select({
        id: missionTemplates.id,
        name: missionTemplates.name,
        zoneId: missionTemplates.zoneId,
        checkCriteria: missionTemplates.checkCriteria,
        cycleDays: missionTemplates.cycleDays,
        version: missionTemplates.version,
      })
      .from(missionTemplates)
      .where(eq(missionTemplates.id, parsed.data.templateId));
    if (!template) return { ok: false, reason: "not-found" } as const;

    const list = await ensurePersonalList(tx, user.id);
    const [existing] = await tx
      .select({ id: missions.id })
      .from(missions)
      .where(
        and(
          eq(missions.listId, list.id),
          eq(missions.templateId, template.id),
          isNull(missions.deletedAt),
        ),
      );

    if (existing) {
      await tx
        .update(missions)
        .set({ active: true })
        .where(eq(missions.id, existing.id));
    } else {
      await tx
        .insert(missions)
        .values({
          listId: list.id,
          templateId: template.id,
          templateVersion: template.version,
          kind: "recurring",
          name: template.name,
          zoneId: template.zoneId,
          checkCriteria: template.checkCriteria,
          cycleDays: template.cycleDays,
        })
        // 동시에 두 번 눌러도 하나만 들어간다(부분 유니크 인덱스)
        .onConflictDoNothing();
    }
    return { ok: true } as const;
  });
}

// ── S13 미션 만들기·수정(#17, 기획서 6.4) ──
// 개수 상한은 두지 않는다. 보상이 하루 10회까지라 많이 만들어도 이득이 없다.
// AI가 만든 초안(M6)도 미리보기에서 고친 뒤 이 createMission으로 저장한다

/** S13 입력값. 고칠 때는 지금 값으로 채운다 */
export type MissionFormValues = {
  name: string;
  zoneId: string | null;
  kind: "recurring" | "once";
  cycleDays: number | null;
  dueDate: string | null;
  checkCriteria: string;
};

export type MissionEditor = {
  /** 구역 순서(시드 order) */
  zones: MissionZone[];
  /** 고칠 미션. 새로 만들 때는 null */
  mission: (MissionFormValues & { id: string }) | null;
};

const editorSchema = z.object({ missionId: z.uuid().optional() });

/**
 * S13 화면 데이터. 로그인이 안 됐거나, 고칠 미션이 없거나 남의 것이거나 지웠거나
 * 기본 미션에서 켠 것이면 null(기본 미션은 S12의 주기 바꾸기·내 기준으로 바꾸기로 고친다)
 */
export async function getMissionEditor(
  input: unknown = {},
): Promise<MissionEditor | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const parsed = editorSchema.safeParse(input);
  if (!parsed.success) return null;
  const { missionId } = parsed.data;
  const db = getDb();

  const [zoneRows, [row]] = await Promise.all([
    db
      .select({ id: zones.id, name: zones.name, icon: zones.icon })
      .from(zones)
      .orderBy(asc(zones.sortOrder)),
    missionId
      ? db
          .select({
            id: missions.id,
            name: missions.name,
            zoneId: missions.zoneId,
            kind: missions.kind,
            cycleDays: missions.cycleDays,
            dueDate: missions.dueDate,
            checkCriteria: missions.checkCriteria,
            templateId: missions.templateId,
            deletedAt: missions.deletedAt,
            ownerType: missionLists.ownerType,
            ownerId: missionLists.ownerId,
          })
          .from(missions)
          .innerJoin(missionLists, eq(missionLists.id, missions.listId))
          .where(eq(missions.id, missionId))
      : Promise.resolve([]),
  ]);
  if (!missionId) return { zones: zoneRows, mission: null };
  if (
    !row ||
    row.templateId !== null ||
    !canEditMission(
      {
        deletedAt: row.deletedAt,
        list: { ownerType: row.ownerType, ownerId: row.ownerId },
      },
      { userId: user.id },
    )
  ) {
    return null;
  }
  return {
    zones: zoneRows,
    mission: {
      id: row.id,
      name: row.name,
      zoneId: row.zoneId,
      kind: row.kind,
      cycleDays: row.cycleDays,
      dueDate: row.dueDate,
      checkCriteria: row.checkCriteria,
    },
  };
}

export type SaveMissionResult =
  | { ok: true; missionId: string }
  | {
      ok: false;
      reason:
        | "login"
        | "invalid"
        | "not-found"
        | "invalid-zone"
        | "name-empty"
        | "name-too-long"
        | "criteria-empty"
        | "criteria-too-long"
        | "invalid-cycle"
        | "invalid-due"
        | "past-due"
        | "far-due";
    };

const missionFormSchema = z.object({
  name: z.string(),
  zoneId: z.string().min(1).nullable(),
  kind: z.enum(["recurring", "once"]),
  cycleDays: z.number().nullish(),
  dueDate: z.string().nullish(),
  checkCriteria: z.string(),
});

type MissionFormInput = z.infer<typeof missionFormSchema>;

type PlannedMission = {
  name: string;
  zoneId: string | null;
  checkCriteria: string;
} & MissionSchedule;

type FormFailure = Extract<SaveMissionResult, { ok: false }>;

/** 이름·완료 기준을 정리하고 종류에 맞는 일정만 남긴다(DB를 보지 않는 검사) */
function planMissionForm(
  form: MissionFormInput,
  { today, currentDueDate }: { today: string; currentDueDate?: string | null },
): { ok: true; values: PlannedMission } | FormFailure {
  const name = normalizeOneLine(form.name, MISSION_NAME_MAX_LENGTH);
  if (!name.ok) return { ok: false, reason: `name-${name.reason}` };
  const criteria = normalizeOneLine(
    form.checkCriteria,
    CHECK_CRITERIA_MAX_LENGTH,
  );
  if (!criteria.ok) return { ok: false, reason: `criteria-${criteria.reason}` };
  const schedule = planMissionSchedule(form, { today, currentDueDate });
  if (!schedule.ok) return schedule;
  return {
    ok: true,
    values: {
      name: name.text,
      zoneId: form.zoneId,
      checkCriteria: criteria.text,
      ...schedule.schedule,
    },
  };
}

async function zoneExists(tx: Tx, zoneId: string | null): Promise<boolean> {
  if (zoneId === null) return true;
  const [zone] = await tx
    .select({ id: zones.id })
    .from(zones)
    .where(eq(zones.id, zoneId));
  return zone !== undefined;
}

const createMissionSchema = missionFormSchema.extend({
  createdBy: z.enum(["user", "ai"]).default("user"),
});

/**
 * S13 직접 만들기. 내 리스트에 켠 채로 넣는다.
 * 한 트랜잭션: 구역 확인 → 리스트 확인(없으면 만듦) → 미션 쓰기
 */
export async function createMission(
  input: unknown,
): Promise<SaveMissionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "login" };
  const parsed = createMissionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const planned = planMissionForm(parsed.data, { today: localDate() });
  if (!planned.ok) return planned;
  const values = planned.values;

  return getDb().transaction(async (tx) => {
    if (!(await zoneExists(tx, values.zoneId))) {
      return { ok: false, reason: "invalid-zone" } as const;
    }
    const list = await ensurePersonalList(tx, user.id);
    const [created] = await tx
      .insert(missions)
      .values({ ...values, listId: list.id, createdBy: parsed.data.createdBy })
      .returning({ id: missions.id });
    return { ok: true, missionId: created.id } as const;
  });
}

const updateMissionSchema = missionFormSchema.extend({ missionId: z.uuid() });

/**
 * S13 수정. 직접 만든 미션만 고친다.
 * 한 트랜잭션: 미션과 리스트 주인 읽기 → 권한 확인 → 값 계산(원래 마감 기준) → 구역 확인 → 쓰기
 */
export async function updateMission(
  input: unknown,
): Promise<SaveMissionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "login" };
  const parsed = updateMissionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const { missionId } = parsed.data;

  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .select({
        dueDate: missions.dueDate,
        templateId: missions.templateId,
        deletedAt: missions.deletedAt,
        ownerType: missionLists.ownerType,
        ownerId: missionLists.ownerId,
      })
      .from(missions)
      .innerJoin(missionLists, eq(missionLists.id, missions.listId))
      .where(eq(missions.id, missionId));
    if (
      !row ||
      row.templateId !== null ||
      !canEditMission(
        {
          deletedAt: row.deletedAt,
          list: { ownerType: row.ownerType, ownerId: row.ownerId },
        },
        { userId: user.id },
      )
    ) {
      return { ok: false, reason: "not-found" } as const;
    }

    const planned = planMissionForm(parsed.data, {
      today: localDate(),
      currentDueDate: row.dueDate,
    });
    if (!planned.ok) return planned;
    if (!(await zoneExists(tx, planned.values.zoneId))) {
      return { ok: false, reason: "invalid-zone" } as const;
    }
    await tx
      .update(missions)
      .set(planned.values)
      .where(eq(missions.id, missionId));
    return { ok: true, missionId } as const;
  });
}
