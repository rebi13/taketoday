"use server";

import { redirect } from "next/navigation";
import { acknowledgeRewards } from "@/server/services";

/** P09를 닫았다: 보여 준 정산을 본 것으로 표시한다. 화면은 이미 닫혔으니 결과를 기다리지 않는다 */
export async function acknowledgeRewardsAction(
  settlementIds: string[],
): Promise<void> {
  const result = await acknowledgeRewards({ settlementIds });
  if (!result.ok && result.reason === "login") redirect("/login");
}
