"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { changeMissionCycle } from "@/server/services";
import {
  MISSION_CYCLE_MAX_DAYS,
  MISSION_CYCLE_MIN_DAYS,
} from "@/shared/config/constants";

export type ChangeCycleState =
  { status: "saved" } | { status: "error"; message: string } | null;

export async function changeCycleAction(
  _previous: ChangeCycleState,
  formData: FormData,
): Promise<ChangeCycleState> {
  const result = await changeMissionCycle({
    missionId: formData.get("missionId"),
    cycleDays: Number(formData.get("cycleDays")),
  });
  if (result.ok) {
    refresh();
    return { status: "saved" };
  }
  if (result.reason === "login") redirect("/login");
  if (result.reason === "not-found") {
    refresh();
    return { status: "error", message: "이미 지운 미션이에요" };
  }
  return {
    status: "error",
    message: `${MISSION_CYCLE_MIN_DAYS}~${MISSION_CYCLE_MAX_DAYS}일 사이로 적어 주세요`,
  };
}
