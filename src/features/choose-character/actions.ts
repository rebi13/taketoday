"use server";

import { redirect } from "next/navigation";
import { chooseCharacter } from "@/server/services";
import { CHARACTER_NAME_MAX_LENGTH } from "@/shared/config/constants";

export type ChooseCharacterState = { error: string } | null;

const MESSAGES = {
  invalid: "함께할 친구를 한 명 골라 주세요",
  empty: "이름을 지어 주세요",
  "too-long": `이름은 ${CHARACTER_NAME_MAX_LENGTH}자까지 지을 수 있어요`,
  "invalid-char": "이름은 한 줄로 지어 주세요",
} as const;

export async function chooseCharacterAction(
  _previous: ChooseCharacterState,
  formData: FormData,
): Promise<ChooseCharacterState> {
  const result = await chooseCharacter({
    characterTypeId: formData.get("characterTypeId") ?? "",
    name: formData.get("name") ?? "",
  });
  if (result.ok) redirect(result.next);
  if (result.reason === "login") redirect("/login");
  return { error: MESSAGES[result.reason] };
}
