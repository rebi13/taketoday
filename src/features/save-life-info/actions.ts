"use server";

import { redirect } from "next/navigation";
import { saveLifeInfo } from "@/server/services";

export type SaveLifeInfoState = { error: string } | null;

export async function saveLifeInfoAction(
  _previous: SaveLifeInfoState,
  formData: FormData,
): Promise<SaveLifeInfoState> {
  const result = await saveLifeInfo({
    household: formData.get("household"),
    conditionTags: formData.getAll("conditionTags"),
  });
  if (result.ok) redirect(result.next);
  if (result.reason === "login") redirect("/login");
  return { error: "어떻게 지내는지 골라 주세요" };
}
