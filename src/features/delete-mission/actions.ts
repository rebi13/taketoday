"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { deleteMission } from "@/server/services";

/**
 * P06 삭제. 이미 지운 미션이면 그대로 성공으로 본다.
 * 상세(S12)에서 지우면 그 화면이 없어지므로 목록으로 보낸다(다시 그리면 404가 잠깐 보인다)
 */
export async function deleteMissionAction(
  missionId: string,
  backToList: boolean,
): Promise<boolean> {
  const result = await deleteMission({ missionId });
  if (!result.ok && result.reason === "login") redirect("/login");
  const ok = result.ok || result.reason === "not-found";
  if (ok && backToList) redirect("/missions");
  refresh();
  return ok;
}
