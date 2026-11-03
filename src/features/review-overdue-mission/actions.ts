"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { deleteMission, setMissionsActive } from "@/server/services";

/** P07 끝내기: 하지 않고 그만둔다. 지우지 않고 꺼 두어 추천에서만 빠진다 */
export async function endOverdueMissionAction(
  missionId: string,
): Promise<boolean> {
  const result = await setMissionsActive({
    missionIds: [missionId],
    active: false,
  });
  if (!result.ok && result.reason === "login") redirect("/login");
  refresh();
  return result.ok;
}

/** P07 삭제. 소프트 삭제라 기록에는 남는다 */
export async function deleteOverdueMissionAction(
  missionId: string,
): Promise<boolean> {
  const result = await deleteMission({ missionId });
  if (!result.ok && result.reason === "login") redirect("/login");
  refresh();
  return result.ok || result.reason === "not-found";
}
