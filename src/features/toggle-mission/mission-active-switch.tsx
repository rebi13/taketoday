"use client";

import { Switch } from "@/shared/ui/switch";

// S11 미션 하나 켜기·끄기. 상태는 useMissionToggle이 쥔다
export function MissionActiveSwitch({
  name,
  active,
  onToggle,
}: {
  name: string;
  active: boolean;
  onToggle: (active: boolean) => void;
}) {
  return (
    <Switch
      checked={active}
      aria-label={`${name} 켜기`}
      onCheckedChange={onToggle}
    />
  );
}
