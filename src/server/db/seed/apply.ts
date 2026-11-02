import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { and, eq, inArray, sql, type SQL } from "drizzle-orm";
import type { PgColumn, PgTransaction } from "drizzle-orm/pg-core";
import { z } from "zod";
import {
  charactersSchema,
  missionTemplateSchema,
  zoneSchema,
} from "../../../../seed/schema";
import { characterTypes, missionTemplates, missions, zones } from "../schema";
import { pickMissionsToSync, planTemplates, type TemplatePlan } from "./plan";

// seed/의 구역·기본 미션·캐릭터 종류를 DB에 맞춘다. 여러 번 돌려도 결과가 같다.
// 아이템 시드는 M4(#27)에서 붙인다.

const SEED_DIR = join(process.cwd(), "seed");
const load = (name: string): unknown =>
  JSON.parse(readFileSync(join(SEED_DIR, name), "utf-8"));

export function loadSeed() {
  return {
    zones: z.array(zoneSchema).parse(load("zones.json")),
    missions: z.array(missionTemplateSchema).parse(load("missions.json")),
    characters: charactersSchema.parse(load("characters.json")),
  };
}

export type Seed = ReturnType<typeof loadSeed>;

// 트랜잭션 타입은 드라이버마다 달라 공통 부분만 받는다
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Tx = PgTransaction<any, any, any>;

/** ON CONFLICT DO UPDATE에서 새로 넣으려던 값 */
const excluded = (column: PgColumn): SQL =>
  sql`excluded.${sql.identifier(column.name)}`;

export type SeedResult = TemplatePlan & {
  /** 버전이 올라 문장을 새로 받은 사용자 미션 수 */
  missionsUpdated: number;
};

export async function applySeed(tx: Tx, seed: Seed): Promise<SeedResult> {
  await tx
    .insert(zones)
    .values(
      seed.zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        icon: zone.icon,
        sortOrder: zone.order,
        conditionTag: zone.conditionTag,
      })),
    )
    .onConflictDoUpdate({
      target: zones.id,
      set: {
        name: excluded(zones.name),
        icon: excluded(zones.icon),
        sortOrder: excluded(zones.sortOrder),
        conditionTag: excluded(zones.conditionTag),
      },
    });

  await tx
    .insert(characterTypes)
    .values(
      seed.characters.types.map((type, index) => ({
        id: type.id,
        name: type.name,
        sortOrder: index + 1,
      })),
    )
    .onConflictDoUpdate({
      target: characterTypes.id,
      set: {
        name: excluded(characterTypes.name),
        sortOrder: excluded(characterTypes.sortOrder),
      },
    });

  const existing = await tx
    .select({
      id: missionTemplates.id,
      name: missionTemplates.name,
      checkCriteria: missionTemplates.checkCriteria,
      version: missionTemplates.version,
    })
    .from(missionTemplates);
  const plan = planTemplates(seed.missions, existing);

  await tx
    .insert(missionTemplates)
    .values(plan.rows)
    .onConflictDoUpdate({
      target: missionTemplates.id,
      set: {
        zoneId: excluded(missionTemplates.zoneId),
        name: excluded(missionTemplates.name),
        checkCriteria: excluded(missionTemplates.checkCriteria),
        cycleDays: excluded(missionTemplates.cycleDays),
        estimatedMinutes: excluded(missionTemplates.estimatedMinutes),
        difficulty: excluded(missionTemplates.difficulty),
        conditionTags: excluded(missionTemplates.conditionTags),
        seasons: excluded(missionTemplates.seasons),
        shareable: excluded(missionTemplates.shareable),
        defaultOn: excluded(missionTemplates.defaultOn),
        version: excluded(missionTemplates.version),
      },
    });

  // 문장이 바뀐 템플릿을 켜 둔 사용자 미션에 반영한다. 사용자가 완료 기준을
  // 고친 미션(user_modified)은 덮어쓰지 않는다(기획서 8.2.1). 주기는 사용자가
  // 바꿨을 수 있어 건드리지 않는다.
  let missionsUpdated = 0;
  for (const id of plan.textChanged) {
    const row = plan.rows.find((r) => r.id === id)!;
    const candidates = await tx
      .select({
        id: missions.id,
        userModified: missions.userModified,
        deletedAt: missions.deletedAt,
        templateVersion: missions.templateVersion,
      })
      .from(missions)
      .where(eq(missions.templateId, id));
    const ids = pickMissionsToSync(candidates, row.version);
    if (ids.length === 0) continue;
    const updated = await tx
      .update(missions)
      .set({
        name: row.name,
        checkCriteria: row.checkCriteria,
        templateVersion: row.version,
      })
      .where(
        and(
          inArray(missions.id, ids),
          // 읽은 뒤 사용자가 기준을 고쳤으면 덮어쓰지 않는다
          eq(missions.userModified, false),
        ),
      )
      .returning({ id: missions.id });
    missionsUpdated += updated.length;
  }

  return { ...plan, missionsUpdated };
}
