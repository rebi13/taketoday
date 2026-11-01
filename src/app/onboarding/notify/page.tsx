import { Suspense } from "react";
import { NotifySettingsForm } from "@/features/finish-onboarding";
import { requireOnboardingStep } from "../_lib/require-step";

// S07 알림 시간·쉬는 날. 마치면 기본 미션이 켜지고 홈으로 간다.
export default function NotifyStepPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">언제 알려 드릴까요?</h1>
        <p className="text-muted-foreground">언제든 설정에서 바꿀 수 있어요.</p>
      </div>
      <Suspense>
        <NotifyStep />
      </Suspense>
    </div>
  );
}

async function NotifyStep() {
  await requireOnboardingStep("/onboarding/notify");
  return <NotifySettingsForm />;
}
