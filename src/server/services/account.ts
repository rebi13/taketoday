import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, isUniqueViolation, users } from "@/server/db";
import { normalizeName } from "@/server/domain";
import {
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
} from "@/shared/config/constants";
import { getSessionUser } from "./session";

export type Account = { email: string; nickname: string | null };

/** S20 설정의 계정 영역 */
export async function getAccount(): Promise<Account | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const [row] = await getDb()
    .select({ nickname: users.nickname })
    .from(users)
    .where(eq(users.id, user.id));
  return row ? { email: user.email, nickname: row.nickname } : null;
}

const updateNicknameSchema = z.object({ nickname: z.string() });

export type UpdateNicknameResult =
  | { ok: true; nickname: string }
  | {
      ok: false;
      reason:
        | "login"
        | "invalid"
        | "empty"
        | "too-short"
        | "too-long"
        | "invalid-char"
        | "taken";
    };

/** 닉네임 바꾸기. 다른 사람과 겹치면 taken */
export async function updateNickname(
  input: unknown,
): Promise<UpdateNicknameResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, reason: "login" };
  const parsed = updateNicknameSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const name = normalizeName(parsed.data.nickname, {
    minLength: NICKNAME_MIN_LENGTH,
    maxLength: NICKNAME_MAX_LENGTH,
  });
  if (!name.ok) return { ok: false, reason: name.reason };

  try {
    await getDb()
      .update(users)
      .set({ nickname: name.name })
      .where(eq(users.id, user.id));
  } catch (error) {
    if (isUniqueViolation(error, "users_nickname_unique")) {
      return { ok: false, reason: "taken" };
    }
    throw error;
  }
  return { ok: true, nickname: name.name };
}
