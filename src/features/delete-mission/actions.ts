"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { deleteMission } from "@/server/services";

/** P06 삭제. 이미 지운 미션이면 그대로 성공으로 본다 */
export async function deleteMissionAction(missionId: string): Promise<boolean> {
  const result = await deleteMission({ missionId });
  if (!result.ok && result.reason === "login") redirect("/login");
  refresh();
  return result.ok || result.reason === "not-found";
}
