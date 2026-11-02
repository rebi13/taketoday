import {
  Bath,
  Bed,
  Car,
  CircleDashed,
  Footprints,
  Monitor,
  Package,
  PawPrint,
  Recycle,
  Refrigerator,
  Shirt,
  Sofa,
  Sprout,
  Utensils,
  WashingMachine,
  type LucideIcon,
} from "lucide-react";

// 구역 아이콘. 시드 zones.json의 icon 값(lucide 이름)을 컴포넌트로 바꾼다.
// 구역을 추가하면 여기에도 아이콘을 넣는다. 모르는 이름이나 구역 없음은 빈 원으로 그린다.
const ZONE_ICONS: Record<string, LucideIcon> = {
  monitor: Monitor,
  bed: Bed,
  shirt: Shirt,
  utensils: Utensils,
  refrigerator: Refrigerator,
  bath: Bath,
  sofa: Sofa,
  footprints: Footprints,
  "washing-machine": WashingMachine,
  recycle: Recycle,
  package: Package,
  "paw-print": PawPrint,
  sprout: Sprout,
  car: Car,
};

export function ZoneIcon({
  icon,
  className,
}: {
  icon: string | null;
  className?: string;
}) {
  const Icon = (icon && ZONE_ICONS[icon]) || CircleDashed;
  return <Icon aria-hidden className={className} />;
}
