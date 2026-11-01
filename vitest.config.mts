import { defineConfig } from "vitest/config";

const resolveFromRoot = (path: string) =>
  new URL(path, import.meta.url).pathname;

export default defineConfig({
  test: {
    // 도메인 테스트는 server/domain 옆에 둔다. E2E는 tests/e2e(Playwright)에서 따로 돈다.
    include: ["src/**/*.test.ts", "seed/**/*.test.ts"],
    alias: {
      "@/": resolveFromRoot("./src/"),
      // server/** 파일은 import "server-only"로 시작한다. 이 패키지는 서버 컴포넌트 밖에서
      // 불리면 예외를 던지므로, 테스트에서는 Next가 서버에서 쓰는 빈 모듈로 바꾼다.
      "server-only": resolveFromRoot("./node_modules/server-only/empty.js"),
    },
  },
});
