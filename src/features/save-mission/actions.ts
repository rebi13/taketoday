"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import {
  createMission,
  updateMission,
  type SaveMissionResult,
} from "@/server/services";
import {
  CHECK_CRITERIA_MAX_LENGTH,
  MISSION_CYCLE_MAX_DAYS,
  MISSION_CYCLE_MIN_DAYS,
  MISSION_DUE_MAX_DAYS,
  MISSION_NAME_MAX_LENGTH,
} from "@/shared/config/constants";
import { NO_ZONE } from "./no-zone";

export type SaveMissionState =
  | { status: "saved"; href: string }
  | { status: "error"; message: string }
  | null;

const MESSAGES: Record<
  Exclude<Extract<SaveMissionResult, { ok: false }>["reason"], "login">,
  string
> = {
  "name-empty": "미션 이름을 적어 주세요",
  "name-too-long": `이름은 ${MISSION_NAME_MAX_LENGTH}자 안으로 적어 주세요`,
  "criteria-empty": "어디까지 하면 완료인지 한 문장으로 적어 주세요",
  "criteria-too-long": `완료 기준은 ${CHECK_CRITERIA_MAX_LENGTH}자 안으로 적어 주세요`,
  "invalid-cycle": `주기는 ${MISSION_CYCLE_MIN_DAYS}~${MISSION_CYCLE_MAX_DAYS}일 사이로 정해 주세요`,
  "invalid-due": "마감일을 골라 주세요",
  "past-due": "마감일은 오늘이나 그 뒤로 골라 주세요",
  "far-due": `마감일은 ${MISSION_DUE_MAX_DAYS}일 안으로 골라 주세요. 더 먼 일은 ‘며칠마다’로 만들어도 좋아요`,
  "invalid-zone": "구역을 다시 골라 주세요",
  invalid: "저장하지 못했어요. 잠시 뒤에 다시 해 주세요",
  "not-found": "이미 지운 미션이에요",
};

/**
 * S13 저장. missionId가 있으면 고치고 없으면 만든다.
 * 만들면 목록(S11)으로, 고치면 그 미션 상세(S12)로 돌아간다(이동과 T04는 화면이 한다)
 */
export async function saveMissionAction(
  _previous: SaveMissionState,
  formData: FormData,
): Promise<SaveMissionState> {
  const missionId = formData.get("missionId");
  const kind = formData.get("kind");
  const zoneId = formData.get("zoneId");
  const cycleDays = formData.get("cycleDays");
  const form = {
    name: formData.get("name") ?? "",
    zoneId: !zoneId || zoneId === NO_ZONE ? null : zoneId,
    kind,
    // 고르지 않은 종류의 값은 보내지 않는다
    cycleDays: kind === "recurring" && cycleDays ? Number(cycleDays) : null,
    dueDate: kind === "once" ? formData.get("dueDate") || null : null,
    checkCriteria: formData.get("checkCriteria") ?? "",
  };

  const result = missionId
    ? await updateMission({ ...form, missionId })
    : await createMission(form);
  if (!result.ok) {
    if (result.reason === "login") redirect("/login");
    return { status: "error", message: MESSAGES[result.reason] };
  }
  refresh();
  return {
    status: "saved",
    href: missionId ? `/missions/${result.missionId}` : "/missions",
  };
}
