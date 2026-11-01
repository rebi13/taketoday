"use server";

import { redirect } from "next/navigation";
import { updateNickname } from "@/server/services";
import {
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
} from "@/shared/config/constants";

export type EditNicknameState =
  | { status: "saved"; nickname: string }
  | { status: "error"; message: string }
  | null;

const LENGTH = `닉네임은 ${NICKNAME_MIN_LENGTH}~${NICKNAME_MAX_LENGTH}자로 지어 주세요`;
const MESSAGES = {
  invalid: LENGTH,
  empty: LENGTH,
  "too-short": LENGTH,
  "too-long": LENGTH,
  "invalid-char": "닉네임은 한 줄로 지어 주세요",
  taken: "이미 누가 쓰고 있는 닉네임이에요. 다른 이름은 어때요?",
} as const;

export async function editNicknameAction(
  _previous: EditNicknameState,
  formData: FormData,
): Promise<EditNicknameState> {
  const result = await updateNickname({
    nickname: formData.get("nickname") ?? "",
  });
  if (result.ok) return { status: "saved", nickname: result.nickname };
  if (result.reason === "login") redirect("/login");
  return { status: "error", message: MESSAGES[result.reason] };
}
