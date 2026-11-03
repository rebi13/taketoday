import "server-only";
import type { MissionTemplate } from "../../../../seed/schema";

// 시드 미션과 DB에 있는 템플릿을 비교해 넣을 행과 버전을 정한다. DB를 모르는 순수 함수.
// 사용자에게 보이는 문장(이름·완료 기준)이 바뀌면 버전을 올린다. 주기·태그 같은
// 나머지 값은 버전 없이 고친다. 버전이 오른 템플릿만 사용자 미션에 반영한다.

export type ExistingTemplate = {
  id: string;
  name: string;
  checkCriteria: string;
  version: number;
};

export type TemplatePlan = {
  rows: (MissionTemplate & { version: number })[];
  /** 처음 들어가는 템플릿 */
  added: string[];
  /** 이름·완료 기준이 바뀌어 버전이 오른 템플릿 */
  textChanged: string[];
  /** DB에는 있는데 시드에서 빠진 템플릿. 사용자 미션이 참조하므로 지우지 않는다 */
  orphaned: string[];
};

export function planTemplates(
  seed: readonly MissionTemplate[],
  existing: readonly ExistingTemplate[],
): TemplatePlan {
  const byId = new Map(existing.map((t) => [t.id, t]));
  const plan: TemplatePlan = {
    rows: [],
    added: [],
    textChanged: [],
    orphaned: [],
  };

  for (const template of seed) {
    const before = byId.get(template.id);
    if (!before) {
      plan.added.push(template.id);
      plan.rows.push({ ...template, version: 1 });
      continue;
    }
    const changed =
      before.name !== template.name ||
      before.checkCriteria !== template.checkCriteria;
    if (changed) plan.textChanged.push(template.id);
    plan.rows.push({
      ...template,
      version: changed ? before.version + 1 : before.version,
    });
  }

  const seedIds = new Set(seed.map((t) => t.id));
  plan.orphaned = existing.filter((t) => !seedIds.has(t.id)).map((t) => t.id);
  return plan;
}

export type SyncCandidate = {
  id: string;
  userModified: boolean;
  deletedAt: Date | null;
  templateVersion: number | null;
};

/**
 * 템플릿 문장(이름·완료 기준)이 바뀌었을 때 따라 바꿀 사용자 미션.
 * 사용자가 완료 기준을 고친 미션(user_modified)은 덮어쓰지 않는다(기획서 8.2.1·18장).
 * 지운 미션과 이미 이 버전을 반영한 미션도 건너뛴다
 */
export function pickMissionsToSync(
  candidates: readonly SyncCandidate[],
  templateVersion: number,
): string[] {
  return candidates
    .filter(
      (m) =>
        !m.userModified &&
        m.deletedAt === null &&
        m.templateVersion !== null &&
        m.templateVersion < templateVersion,
    )
    .map((m) => m.id);
}
