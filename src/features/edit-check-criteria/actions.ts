"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import {
  resetCheckCriteria,
  updateCheckCriteria,
  type CriteriaChangeResult,
} from "@/server/services";
import { CHECK_CRITERIA_MAX_LENGTH } from "@/shared/config/constants";

export type EditCriteriaState =
  | { status: "saved"; checkCriteria: string; userModified: boolean }
  | { status: "error"; message: string }
  | null;

const MESSAGES = {
  empty: "어디까지 하면 완료인지 한 문장으로 적어 주세요",
  "too-long": `${CHECK_CRITERIA_MAX_LENGTH}자 안으로 적어 주세요`,
  invalid: "저장하지 못했어요. 잠시 뒤에 다시 해 주세요",
  "not-found": "이미 지운 미션이에요",
} as const;

function toState(result: CriteriaChangeResult): EditCriteriaState {
  if (result.ok) {
    refresh();
    return {
      status: "saved",
      checkCriteria: result.checkCriteria,
      userModified: result.userModified,
    };
  }
  if (result.reason === "login") redirect("/login");
  return { status: "error", message: MESSAGES[result.reason] };
}

/** P25 내 기준으로 바꾸기 */
export async function updateCriteriaAction(
  _previous: EditCriteriaState,
  formData: FormData,
): Promise<EditCriteriaState> {
  return toState(
    await updateCheckCriteria({
      missionId: formData.get("missionId"),
      checkCriteria: formData.get("checkCriteria") ?? "",
    }),
  );
}

/** P25 기본 기준으로 되돌리기 */
export async function resetCriteriaAction(
  missionId: string,
): Promise<EditCriteriaState> {
  return toState(await resetCheckCriteria({ missionId }));
}
