"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { cancelCompletion } from "@/server/services";

export type CancelActionResult =
  { ok: true } | { ok: false; reason: "past-day" | "error" };

/** 완료 취소. date는 화면이 보던 날(완료한 날). 이미 취소했으면 그대로 성공으로 본다 */
export async function cancelCompletionAction(
  missionId: string,
  date: string,
): Promise<CancelActionResult> {
  const result = await cancelCompletion({ missionId, date });
  if (!result.ok && result.reason === "login") redirect("/login");
  refresh();
  // 이미 취소했으면(not-found) 원하는 상태가 됐으므로 성공으로 본다
  if (result.ok || result.reason === "not-found") return { ok: true };
  return {
    ok: false,
    reason: result.reason === "past-day" ? "past-day" : "error",
  };
}
