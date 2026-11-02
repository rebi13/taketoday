import { Badge } from "@/shared/ui/badge";
import { ZoneIcon } from "./zone-icon";

/** 구역 이름표. 구역이 없는 직접 만든 미션은 "구역 없음" */
export function ZoneBadge({
  zone,
}: {
  zone: { name: string; icon: string } | null;
}) {
  return (
    <Badge variant="secondary">
      <ZoneIcon icon={zone?.icon ?? null} />
      {zone?.name ?? "구역 없음"}
    </Badge>
  );
}
