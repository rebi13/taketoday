"use client";

import { Button } from "@/shared/ui/button";

// S11 구역 하나의 미션을 모두 켜거나 끈다. 하나라도 꺼져 있으면 "모두 켜기"
export function ZoneToggleButton({
  zoneName,
  allActive,
  onToggle,
}: {
  zoneName: string;
  allActive: boolean;
  onToggle: (active: boolean) => void;
}) {
  const label = allActive ? "모두 끄기" : "모두 켜기";
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={`${zoneName} ${label}`}
      onClick={() => onToggle(!allActive)}
    >
      {label}
    </Button>
  );
}
