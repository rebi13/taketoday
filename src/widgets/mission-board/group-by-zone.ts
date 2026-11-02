import type { BoardZone } from "./types";

export type ZoneGroup<T> = { zone: BoardZone | null; items: T[] };

/** 구역 순서대로 묶는다. 빈 구역은 빼고, 구역 없는 미션은 맨 뒤에 */
export function groupByZone<T extends { zoneId: string | null }>(
  zones: readonly BoardZone[],
  items: readonly T[],
): ZoneGroup<T>[] {
  const groups: ZoneGroup<T>[] = zones.map((zone) => ({
    zone,
    items: items.filter((item) => item.zoneId === zone.id),
  }));
  const known = new Set(zones.map((zone) => zone.id));
  groups.push({
    zone: null,
    items: items.filter(
      (item) => item.zoneId === null || !known.has(item.zoneId),
    ),
  });
  return groups.filter((group) => group.items.length > 0);
}
