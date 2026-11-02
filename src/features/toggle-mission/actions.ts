"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { setMissionActive } from "@/server/services";

/** 켜기·끄기. 실패하면 false를 돌려주고, 화면은 서버 값으로 다시 그린다 */
export async function setMissionActiveAction(
  missionId: string,
  active: boolean,
): Promise<boolean> {
  const result = await setMissionActive({ missionId, active });
  if (!result.ok && result.reason === "login") redirect("/login");
  refresh();
  return result.ok;
}
