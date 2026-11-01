import "server-only";
import { existsSync } from "node:fs";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { applySeed, loadSeed } from "./apply";

// 실행: pnpm db:seed
// Vercel 빌드에서 마이그레이션 다음에 돈다(ADR 0008). 로컬은 .env.local의 develop에 넣는다.
// 마이그레이션과 같이 풀링을 거치지 않는 직접 연결을 쓴다.

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.DATABASE_URL_UNPOOLED;
if (!url)
  throw new Error("DATABASE_URL_UNPOOLED가 없다. docs/setup.md를 본다.");

async function main() {
  const seed = loadSeed();
  const pool = new Pool({ connectionString: url });
  try {
    const db = drizzle({ client: pool });
    const result = await db.transaction((tx) => applySeed(tx, seed));
    console.log(
      [
        `시드 적용: 구역 ${seed.zones.length} · 캐릭터 ${seed.characters.types.length} · 미션 템플릿 ${seed.missions.length}`,
        `새 템플릿 ${result.added.length} · 문장 바뀐 템플릿 ${result.textChanged.length} · 반영한 사용자 미션 ${result.missionsUpdated}`,
      ].join("\n"),
    );
    if (result.orphaned.length) {
      console.warn(
        `시드에서 빠졌지만 DB에 남겨 둔 템플릿: ${result.orphaned.join(", ")}`,
      );
    }
  } finally {
    await pool.end();
  }
}

// tsx는 이 파일을 CommonJS로 돌려 최상위 await를 쓸 수 없다
main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
