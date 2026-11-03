"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { completeMission, type CompleteMissionResult } from "@/server/services";

export type CompleteActionResult =
  | Extract<CompleteMissionResult, { ok: true }>
  | { ok: false; reason: "already" | "past-day" | "error" };

/**
 * S10 완료·다시 완료. date는 화면이 보던 날: 자정을 넘긴 화면에서 누르면 거부하고
 * 오늘 추천으로 다시 그린다
 */
export async function completeMissionAction(
  missionId: string,
  date: string,
): Promise<CompleteActionResult> {
  const result = await completeMission({ missionId, date });
  if (!result.ok && result.reason === "login") redirect("/login");
  refresh();
  if (result.ok) return result;
  return {
    ok: false,
    reason:
      result.reason === "already" || result.reason === "past-day"
        ? result.reason
        : "error",
  };
}
