// 실행: pnpm seed:validate
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import {
  zoneSchema, missionTemplateSchema, itemSchema, itemSetSchema, roomSlotsSchema, charactersSchema,
} from "./schema";

const dir = __dirname;
const load = (name: string): unknown => JSON.parse(readFileSync(join(dir, name), "utf-8"));

const zones = z.array(zoneSchema).length(14).parse(load("zones.json"));
const missions = z.array(missionTemplateSchema).parse(load("missions.json"));
const items = z.array(itemSchema).length(30).parse(load("items.json"));
const sets = z.array(itemSetSchema).length(3).parse(load("item-sets.json"));
const slots = roomSlotsSchema.parse(load("room-slots.json"));
charactersSchema.parse(load("characters.json"));

const errors: string[] = [];
const zoneIds = new Set(zones.map((zone) => zone.id));
const setIds = new Set(sets.map((set) => set.id));
const slotTypes = new Set(slots.slots.map((slot) => slot.slotType));
const unique = (label: string, ids: string[]) => {
  if (new Set(ids).size !== ids.length) errors.push(`${label} id 중복`);
};

unique("미션", missions.map((m) => m.id));
unique("아이템", items.map((i) => i.id));
if (missions.length < 80 || missions.length > 100) errors.push(`미션 수 ${missions.length} (목표 80~100)`);

for (const m of missions) {
  if (!zoneIds.has(m.zoneId)) errors.push(`${m.id}: 없는 구역 ${m.zoneId}`);
  const zone = zones.find((z) => z.id === m.zoneId);
  if (zone?.conditionTag && !m.conditionTags.includes(zone.conditionTag)) {
    errors.push(`${m.id}: 조건 구역인데 조건 태그 없음`);
  }
}
for (const i of items) {
  if (i.setId && !setIds.has(i.setId)) errors.push(`${i.id}: 없는 세트 ${i.setId}`);
  if (!slotTypes.has(i.slotType)) errors.push(`${i.id}: 없는 슬롯 ${i.slotType}`);
  if ((i.slotType === "costume") !== (i.costumeAnchor !== null)) errors.push(`${i.id}: 꾸미기 기준점 불일치`);
  if ((i.acquisition === "starter") !== (i.price === 0)) errors.push(`${i.id}: 시작 선물 가격 불일치`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
const shopTotal = items.filter((i) => i.acquisition === "shop").reduce((sum, i) => sum + i.price, 0);
console.log(`OK 구역 ${zones.length} · 미션 ${missions.length} · 아이템 ${items.length} · 판매 아이템 합계 ${shopTotal}`);
