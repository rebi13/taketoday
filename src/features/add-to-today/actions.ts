"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { addToToday, removeFromToday } from "@/server/services";

/** S10 오늘 더 하기: 추천 밖의 내 미션을 오늘 목록에 넣는다 */
export async function addToTodayAction(missionId: string): Promise<boolean> {
  const result = await addToToday({ missionId });
  if (!result.ok && result.reason === "login") redirect("/login");
  refresh();
  return result.ok;
}

/** 오늘 더 하기로 넣은 것 빼기(한 번도 완료하지 않은 것만) */
export async function removeFromTodayAction(
  missionId: string,
): Promise<boolean> {
  const result = await removeFromToday({ missionId });
  if (!result.ok && result.reason === "login") redirect("/login");
  refresh();
  return result.ok;
}
