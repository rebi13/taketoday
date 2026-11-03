import "server-only";
import {
  MISSION_CYCLE_MAX_DAYS,
  MISSION_CYCLE_MIN_DAYS,
} from "@/shared/config/constants";
import { canAccessList, type ListOwner, type ListViewer } from "./list-access";

// 내 미션 목록(S11)·기본 미션 둘러보기(S15)의 규칙(기획서 6.3·8.6, screen-flow "미션 관리").

/** 주기형 미션의 주기(일)가 맞는 값인가 */
export function isCycleDays(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= MISSION_CYCLE_MIN_DAYS &&
    value <= MISSION_CYCLE_MAX_DAYS
  );
}

export type EditableMission = {
  deletedAt: Date | null;
  list: ListOwner;
};

/** 이 사용자가 미션을 켜고 끄고 고치고 지울 수 있는가. 지운 미션은 고치지 않는다 */
export function canEditMission(
  mission: EditableMission,
  viewer: ListViewer,
): boolean {
  return mission.deletedAt === null && canAccessList(mission.list, viewer);
}

/**
 * S15에 보여줄 기본 미션: 내 리스트에 아직 없는 것(지운 것 포함).
 * 리스트에 있는데 꺼 둔 미션은 S11에서 다시 켠다.
 */
export function pickBrowsableTemplates<T extends { id: string }>(
  templates: readonly T[],
  myMissions: readonly {
    templateId: string | null;
    deletedAt: Date | null;
  }[],
): T[] {
  const owned = new Set(
    myMissions
      .filter((m) => m.templateId !== null && m.deletedAt === null)
      .map((m) => m.templateId),
  );
  return templates.filter((t) => !owned.has(t.id));
}

// ── 완료 기준 바꾸기 (P25, 기획서 8.2.1) ──

export type CriteriaResult =
  { ok: true; text: string } | { ok: false; reason: "empty" | "too-long" };

/**
 * 완료 기준 문장을 정리한다. 한 문장이므로 줄바꿈·연속 공백은 공백 하나로 줄인다.
 * 길이는 DB의 char_length와 같은 기준(코드 포인트)으로 센다
 */
export function normalizeCheckCriteria(
  raw: string,
  maxLength: number,
): CriteriaResult {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return { ok: false, reason: "empty" };
  if ([...text].length > maxLength) return { ok: false, reason: "too-long" };
  return { ok: true, text };
}

export type CriteriaTemplate = {
  name: string;
  checkCriteria: string;
  version: number;
};

export type CriteriaPatch =
  | { checkCriteria: string; userModified: true }
  | {
      checkCriteria: string;
      userModified: false;
      name: string;
      templateVersion: number;
    };

/**
 * 완료 기준을 바꿀 때 미션에 쓸 값. 고친 기준은 user_modified로 표시해
 * 기본 미션 문장이 바뀌어도 덮어쓰지 않는다.
 * 기본 기준과 같은 문장이면(되돌리기 포함) 다시 기본 미션을 따라가게 하고,
 * 그사이 바뀐 기본 미션의 이름·버전도 함께 맞춘다
 */
export function planCriteriaChange(
  text: string,
  template: CriteriaTemplate | null,
): CriteriaPatch {
  if (template && text === template.checkCriteria) {
    return {
      checkCriteria: template.checkCriteria,
      userModified: false,
      name: template.name,
      templateVersion: template.version,
    };
  }
  return { checkCriteria: text, userModified: true };
}
