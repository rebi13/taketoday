"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { completeMission, type CompleteMissionResult } from "@/server/services";

export type CompleteActionResult =
  | Extract<CompleteMissionResult, { ok: true }>
  | { ok: false; reason: "already" | "error" };

/** S10 완료. 오늘 추천과 적립 예정을 다시 그린다 */
export async function completeMissionAction(
  missionId: string,
): Promise<CompleteActionResult> {
  const result = await completeMission({ missionId });
  if (!result.ok && result.reason === "login") redirect("/login");
  refresh();
  if (result.ok) return result;
  return {
    ok: false,
    reason: result.reason === "already" ? "already" : "error",
  };
}
