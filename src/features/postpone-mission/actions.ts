"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { postponeMission } from "@/server/services";

/** S10 내일로. 이미 미뤘으면 그대로 성공 */
export async function postponeMissionAction(
  missionId: string,
): Promise<boolean> {
  const result = await postponeMission({ missionId });
  if (!result.ok && result.reason === "login") redirect("/login");
  refresh();
  return result.ok;
}
