import { redirect } from "next/navigation";
import { Suspense } from "react";
import { TermsAgreementForm } from "@/features/agree-terms";
import { getAppEntry } from "@/server/services";

// S02 약관 동의 · 만 14세 이상 확인
export default function TermsStepPage() {
  return (
    <div className="flex flex-col gap-8">
      <Suspense>
        <OnlyOnThisStep />
      </Suspense>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">반가워요</h1>
        <p className="text-muted-foreground">
          시작하기 전에 아래 내용을 확인해 주세요.
        </p>
      </div>
      <TermsAgreementForm />
    </div>
  );
}

/** 이미 동의했거나 로그인하지 않았으면 맞는 곳으로 보낸다 */
async function OnlyOnThisStep() {
  const entry = await getAppEntry();
  if (entry.kind === "login") redirect("/login");
  if (entry.kind === "ready") redirect("/");
  if (entry.path !== "/onboarding/terms") redirect(entry.path);
  return null;
}
