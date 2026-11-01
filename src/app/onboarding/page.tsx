import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getAppEntry } from "@/server/services";

// /onboarding은 지금 해야 할 단계로 보낸다
export default function OnboardingIndexPage() {
  return (
    <Suspense>
      <GoToStep />
    </Suspense>
  );
}

// 항상 redirect로 끝나지만 JSX 컴포넌트로 쓰려면 반환 타입이 필요하다
async function GoToStep(): Promise<null> {
  const entry = await getAppEntry();
  if (entry.kind === "login") redirect("/login");
  redirect(entry.kind === "onboarding" ? entry.path : "/");
}
