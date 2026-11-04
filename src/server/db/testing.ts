import "server-only";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Db } from "./client";
import * as schema from "./schema";

// 테스트 전용(ADR 0010). 메모리 안의 Postgres(PGlite)에 마이그레이션을 모두 적용해,
// 유니크 제약·트랜잭션에 기대는 서비스(정산·구매)를 접속 정보 없이 실제 SQL로 확인한다.
// 앱 코드에서는 가져오지 않는다(db/index.ts로 내보내지 않음).

const MIGRATIONS = fileURLToPath(new URL("./migrations", import.meta.url));

export async function createTestDb(): Promise<{
  db: Db;
  close: () => Promise<void>;
}> {
  const client = new PGlite();
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  // 쿼리 빌더 API는 Neon 드라이버와 같다. 서비스 함수가 받는 Db 타입으로 넘긴다
  return { db: db as unknown as Db, close: () => client.close() };
}
