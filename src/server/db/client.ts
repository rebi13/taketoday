import "server-only";
import { Pool } from "@neondatabase/serverless";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/neon-serverless";
import { serverEnv } from "@/shared/config/env";
import * as schema from "./schema";

// 여러 단계 트랜잭션이 필요해 HTTP가 아닌 WebSocket Pool을 쓴다(docs/setup.md).
// Node 22에는 WebSocket이 내장돼 있어 ws를 따로 넣지 않는다.
function createDb() {
  const pool = new Pool({ connectionString: serverEnv().DATABASE_URL });
  // Vercel 함수가 멈추기 전에 쉬는 연결을 닫게 한다. Vercel 밖에서는 아무 일도 하지 않는다.
  attachDatabasePool(pool);
  return drizzle({ client: pool, schema });
}

export type Db = ReturnType<typeof createDb>;

// 개발 서버의 HMR이 모듈을 다시 읽어도 Pool을 하나만 쓴다
const globalForDb = globalThis as { taketodayDb?: Db };

export function getDb(): Db {
  globalForDb.taketodayDb ??= createDb();
  return globalForDb.taketodayDb;
}
