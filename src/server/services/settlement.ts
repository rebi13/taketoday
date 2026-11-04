import "server-only";
import { getDb } from "@/server/db";
import { localDate } from "@/shared/lib/date";
import { getSessionUser } from "./session";
import { settlePendingDays, walletBalance } from "./settle-days";

export type { SettledDay } from "./settle-days";

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
