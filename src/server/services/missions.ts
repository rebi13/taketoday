import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
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
  pickBrowsableTemplates,
} from "@/server/domain";
import { ensurePersonalList } from "./lists";
import { getSessionUser } from "./session";

// S11 내 미션 목록과 S15 기본 미션 둘러보기(#15).
// 상세(S12)·완료 기준 바꾸기는 #16, 직접 만들기(S13)는 #17.

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
  missionId: z.uuid(),
  active: z.boolean(),
});

/** S11 켜기·끄기. 꺼 둔 미션은 추천에서 빠지고 목록에는 남는다 */
export async function setMissionActive(
  input: unknown,
): Promise<MissionChangeResult> {
  const parsed = setActiveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const { missionId, active } = parsed.data;
  return changeMission(missionId, () => ({ active }));
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
  return changeMission(missionId, (mission) =>
    mission.kind === "recurring" ? { cycleDays } : null,
  );
}

const deleteSchema = z.object({ missionId: z.uuid() });

/** P06 삭제. 기록과 정산 이력이 참조하므로 지우지 않고 deletedAt만 채운다 */
export async function deleteMission(
  input: unknown,
): Promise<MissionChangeResult> {
  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  return changeMission(parsed.data.missionId, () => ({
    deletedAt: new Date(),
  }));
}

type MissionPatch = Partial<
  Pick<typeof missions.$inferInsert, "active" | "cycleDays" | "deletedAt">
>;

/**
 * 미션 하나를 고치는 공통 흐름. 한 트랜잭션: 미션과 리스트 주인 읽기 →
 * 권한 확인(canEditMission) → 바꿀 값 계산 → 쓰기.
 * patch가 null을 돌려주면 이 미션에는 맞지 않는 변경이다(invalid)
 */
async function changeMission(
  missionId: string,
  patch: (mission: { kind: "recurring" | "once" }) => MissionPatch | null,
): Promise<MissionChangeResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "login" };

  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .select({
        kind: missions.kind,
        deletedAt: missions.deletedAt,
        ownerType: missionLists.ownerType,
        ownerId: missionLists.ownerId,
      })
      .from(missions)
      .innerJoin(missionLists, eq(missionLists.id, missions.listId))
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

    const values = patch({ kind: row.kind });
    if (!values) return { ok: false, reason: "invalid" } as const;
    await tx.update(missions).set(values).where(eq(missions.id, missionId));
    return { ok: true } as const;
  });
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
