import { Suspense } from "react";
import { ChooseCharacterForm } from "@/features/choose-character";
import { listCharacterTypes } from "@/server/services";
import { requireOnboardingStep } from "../_lib/require-step";

// S04 캐릭터 고르기·이름 짓기. S03 환영 소개는 빼고 여기에 한 줄 소개를 둔다(screen-flow ①).
export default function CharacterStepPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">함께할 친구를 골라 주세요</h1>
        <p className="text-muted-foreground">
          오늘챙김은 매일 할 만큼만 골라 드려요. 미션을 해낼 때마다 이 친구가
          사는 방을 꾸밀 수 있어요.
        </p>
      </div>
      <Suspense>
        <CharacterStep />
      </Suspense>
    </div>
  );
}

async function CharacterStep() {
  await requireOnboardingStep("/onboarding/character");
  return <ChooseCharacterForm types={await listCharacterTypes()} />;
}
