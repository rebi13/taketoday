"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { setMissionsActive } from "@/server/services";

/** 켜기·끄기(하나 또는 구역 하나). 실패하면 false를 돌려주고, 화면은 서버 값으로 다시 그린다 */
export async function setMissionsActiveAction(
  missionIds: string[],
  active: boolean,
): Promise<boolean> {
  const result = await setMissionsActive({ missionIds, active });
  if (!result.ok && result.reason === "login") redirect("/login");
  refresh();
  return result.ok;
}
