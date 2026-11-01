import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// 로컬은 .env.local을 읽고, Vercel 빌드는 프로젝트 환경변수를 쓴다(이미 있는 값은 덮어쓰지 않는다).
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url)
  throw new Error("DATABASE_URL_UNPOOLED가 없다. docs/setup.md를 본다.");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/migrations",
  // 마이그레이션은 풀링을 거치지 않는 직접 연결로 돌린다
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
