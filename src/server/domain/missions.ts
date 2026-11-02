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
