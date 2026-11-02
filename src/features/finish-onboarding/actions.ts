"use server";

import { redirect } from "next/navigation";
import { finishOnboarding } from "@/server/services";

export type FinishOnboardingState = { error: string } | null;

export async function finishOnboardingAction(
  _previous: FinishOnboardingState,
  formData: FormData,
): Promise<FinishOnboardingState> {
  const result = await finishOnboarding({
    notifyTime: formData.get("notifyTime"),
    restDays: formData.getAll("restDays").map(Number),
  });
  if (result.ok) redirect("/");
  if (result.reason === "login") redirect("/login");
  // 앞 단계를 마치지 않았거나 이미 마쳤으면 맞는 곳으로 보낸다
  if (result.reason === "not-ready") redirect("/onboarding");
  return { error: "알림 시간을 다시 골라 주세요" };
}
