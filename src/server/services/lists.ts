import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb, missionLists } from "@/server/db";

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

/** 개인 리스트는 사용자당 하나. 없으면 만들고, 있으면 그것을 돌려준다 */
export async function ensurePersonalList(
  tx: Tx,
  userId: string,
): Promise<{ id: string }> {
  await tx
    .insert(missionLists)
    .values({ ownerType: "user", ownerId: userId })
    .onConflictDoNothing();
  const [list] = await tx
    .select({ id: missionLists.id })
    .from(missionLists)
    .where(
      and(eq(missionLists.ownerType, "user"), eq(missionLists.ownerId, userId)),
    );
  return list;
}
