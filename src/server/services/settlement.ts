import "server-only";
import { z } from "zod";
import { getDb } from "@/server/db";
import { localDate } from "@/shared/lib/date";
import { getSessionUser } from "./session";
import {
  markRewardsSeen,
  settlePendingDays,
  walletBalance,
} from "./settle-days";

export type { RewardArrival, SettledDay } from "./settle-days";

export type Wallet = { balance: number };

/** 재화 잔액. 로그인이 안 됐으면 null. 밀린 정산을 먼저 끝내고 센다(한 트랜잭션) */
export async function getWallet(): Promise<Wallet | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const today = localDate();
  return getDb().transaction(async (tx) => {
    await settlePendingDays(tx, user.id, today);
    return { balance: await walletBalance(tx, user.id) };
  });
}

const seenSchema = z.object({
  settlementIds: z.array(z.uuid()).min(1).max(400),
});

export type AcknowledgeRewardsResult =
  { ok: true } | { ok: false; reason: "login" | "invalid" };

/** P09 "어제 보상 도착"을 닫았다. 보여 준 정산을 본 것으로 표시해 다시 띄우지 않는다 */
export async function acknowledgeRewards(
  input: unknown,
): Promise<AcknowledgeRewardsResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "login" };
  const parsed = seenSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  await markRewardsSeen(getDb(), user.id, parsed.data.settlementIds);
  return { ok: true };
}
