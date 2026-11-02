"use client";

import { useOptimistic, useTransition } from "react";
import { Switch } from "@/shared/ui/switch";
import { setMissionActiveAction } from "./actions";

// S11 켜기·끄기. 누르면 바로 바뀌어 보이고, 저장이 끝나면 서버 값으로 맞춘다
export function MissionActiveSwitch({
  missionId,
  name,
  active,
}: {
  missionId: string;
  name: string;
  active: boolean;
}) {
  const [optimistic, setOptimistic] = useOptimistic(active);
  const [, startTransition] = useTransition();

  return (
    <Switch
      checked={optimistic}
      aria-label={`${name} 켜기`}
      onCheckedChange={(checked) =>
        startTransition(async () => {
          setOptimistic(checked);
          await setMissionActiveAction(missionId, checked);
        })
      }
    />
  );
}
