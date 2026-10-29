import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 도메인 테스트는 server/domain 옆에 둔다. E2E는 tests/e2e(Playwright)에서 따로 돈다.
    include: ["src/**/*.test.ts", "seed/**/*.test.ts"],
    alias: {
      "@/": new URL("./src/", import.meta.url).pathname,
    },
  },
});
