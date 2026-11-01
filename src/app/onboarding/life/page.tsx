import { Suspense } from "react";
import { LifeInfoForm } from "@/features/save-life-info";
import { listStartingMissionCandidates } from "@/server/services";
import { requireOnboardingStep } from "../_lib/require-step";

// S05 생활 정보(거주 형태·조건). S06 켜질 미션 확인을 합쳤다(screen-flow ②).
export default function LifeStepPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">생활을 조금만 알려 주세요</h1>
        <p className="text-muted-foreground">
          알려 주신 만큼 맞는 미션을 켜 둘게요.
        </p>
      </div>
      <Suspense>
        <LifeStep />
      </Suspense>
    </div>
  );
}

async function LifeStep() {
  await requireOnboardingStep("/onboarding/life");
  return <LifeInfoForm candidates={await listStartingMissionCandidates()} />;
}
