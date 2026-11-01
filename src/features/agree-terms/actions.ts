"use server";

import { redirect } from "next/navigation";
import { agreeToTerms } from "@/server/services";

export type AgreeTermsState = { error: string } | null;

export async function agreeTermsAction(
  _previous: AgreeTermsState,
  formData: FormData,
): Promise<AgreeTermsState> {
  // 체크박스는 체크했을 때만 "on"으로 넘어온다. 서버에서 다시 확인한다
  const result = await agreeToTerms({
    terms: formData.get("terms") === "on",
    privacy: formData.get("privacy") === "on",
    over14: formData.get("over14") === "on",
  });
  if (result.ok) redirect(result.next);
  if (result.reason === "login") redirect("/login");
  return { error: "세 항목에 모두 동의하면 시작할 수 있어요" };
}
