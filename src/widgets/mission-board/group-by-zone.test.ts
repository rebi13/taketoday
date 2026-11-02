import { describe, expect, it } from "vitest";
import { groupByZone } from "./group-by-zone";

const zones = [
  { id: "desk", name: "책상", icon: "monitor" },
  { id: "bath", name: "욕실", icon: "bath" },
  { id: "car", name: "차량", icon: "car" },
];

describe("groupByZone", () => {
  it("구역 순서대로 묶고 빈 구역은 뺀다", () => {
    const groups = groupByZone(zones, [
      { id: "a", zoneId: "bath" },
      { id: "b", zoneId: "desk" },
      { id: "c", zoneId: "bath" },
    ]);
    expect(groups.map((g) => [g.zone?.id, g.items.map((i) => i.id)])).toEqual([
      ["desk", ["b"]],
      ["bath", ["a", "c"]],
    ]);
  });

  it("구역 없는 미션은 맨 뒤에 모은다", () => {
    const groups = groupByZone(zones, [
      { id: "a", zoneId: null },
      { id: "b", zoneId: "car" },
    ]);
    expect(groups.map((g) => g.zone?.id ?? null)).toEqual(["car", null]);
  });
});
