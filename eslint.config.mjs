import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import boundaries from "eslint-plugin-boundaries";

// 층 간 import 규칙 (CLAUDE.md "폴더 구조와 의존 규칙", implementation-plan 3.1)
// - app → widgets → features → entities → shared 방향으로만
// - 같은 층의 다른 슬라이스는 가져오지 않는다
// - 다른 슬라이스는 index.ts로만 가져온다
// - 화면 코드는 server/services만 부른다. server/domain은 DB·네트워크를 모른다
const SLICE_ENTRY = "index.ts";

/** 다른 슬라이스를 가져올 때 index.ts만 허용하는 선택자 */
const entry = (type) => ({
  element: { type, fileInternalPath: SLICE_ENTRY },
});

const layerBoundaries = {
  files: ["src/**/*.{ts,tsx}"],
  plugins: { boundaries },
  settings: {
    "boundaries/elements": [
      { type: "app", pattern: "src/app", partialMatch: false },
      {
        type: "widgets",
        pattern: "src/widgets/*",
        capture: ["slice"],
        partialMatch: false,
      },
      {
        type: "features",
        pattern: "src/features/*",
        capture: ["slice"],
        partialMatch: false,
      },
      {
        type: "entities",
        pattern: "src/entities/*",
        capture: ["slice"],
        partialMatch: false,
      },
      {
        type: "shared",
        pattern: "src/shared/*",
        capture: ["segment"],
        partialMatch: false,
      },
      {
        type: "server",
        pattern: "src/server/*",
        capture: ["segment"],
        partialMatch: false,
      },
    ],
  },
  rules: {
    "boundaries/dependencies": [
      2,
      {
        default: "disallow",
        policies: [
          // 같은 슬라이스 안에서는 자유롭게 가져온다
          {
            from: { element: { type: "*" } },
            allow: { dependency: { relationship: { to: "internal" } } },
          },
          {
            from: { element: { type: "app" } },
            allow: {
              to: [
                entry("widgets"),
                entry("features"),
                entry("entities"),
                { element: { type: "shared" } },
                {
                  element: {
                    type: "server",
                    captured: { segment: "services" },
                    fileInternalPath: SLICE_ENTRY,
                  },
                },
              ],
            },
          },
          {
            from: { element: { type: "widgets" } },
            allow: {
              to: [
                entry("features"),
                entry("entities"),
                { element: { type: "shared" } },
              ],
            },
          },
          {
            // Server Action이 features에 있으므로 services를 부를 수 있다
            from: { element: { type: "features" } },
            allow: {
              to: [
                entry("entities"),
                { element: { type: "shared" } },
                {
                  element: {
                    type: "server",
                    captured: { segment: "services" },
                    fileInternalPath: SLICE_ENTRY,
                  },
                },
              ],
            },
          },
          {
            from: { element: { type: "entities" } },
            allow: { to: { element: { type: "shared" } } },
          },
          {
            // shared 안의 ui·lib·config는 서로 가져올 수 있다 (예: ui → lib의 cn)
            from: { element: { type: "shared" } },
            allow: { to: { element: { type: "shared" } } },
          },
          {
            // server는 도메인을 모르는 shared(lib·config)만 쓴다
            from: { element: { type: "server" } },
            allow: {
              to: {
                element: {
                  type: "shared",
                  captured: { segment: ["lib", "config"] },
                },
              },
            },
          },
          {
            // services는 트랜잭션 단위로 다른 server 슬라이스를 조합한다
            from: {
              element: { type: "server", captured: { segment: "services" } },
            },
            allow: {
              to: {
                element: {
                  type: "server",
                  captured: { segment: ["domain", "db", "ai", "push", "auth"] },
                  fileInternalPath: SLICE_ENTRY,
                },
              },
            },
          },
          {
            // Auth.js의 Drizzle adapter가 db를 쓴다
            from: {
              element: { type: "server", captured: { segment: "auth" } },
            },
            allow: {
              to: {
                element: {
                  type: "server",
                  captured: { segment: "db" },
                  fileInternalPath: SLICE_ENTRY,
                },
              },
            },
          },
        ],
      },
    ],
  },
};

// 색은 globals.css의 토큰으로만 쓴다 (implementation-plan 2.3 ①).
// bg-[#f2994a], text-[rgb(...)] 같은 임의 값 색을 막는다. bg-[var(--x)] 같은 토큰 참조는 허용한다.
const ARBITRARY_COLOR =
  "/\\[[^\\]]*(#[0-9a-fA-F]{3}|rgba?\\(|hsla?\\(|oklch\\(|oklab\\()/";
const ARBITRARY_COLOR_MESSAGE =
  "색은 globals.css 토큰(bg-primary, text-reward 등)으로만 쓴다. 새 색이 필요하면 토큰을 추가한다.";

const designTokens = {
  files: ["src/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector: `Literal[value=${ARBITRARY_COLOR}]`,
        message: ARBITRARY_COLOR_MESSAGE,
      },
      {
        selector: `TemplateElement[value.raw=${ARBITRARY_COLOR}]`,
        message: ARBITRARY_COLOR_MESSAGE,
      },
    ],
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "cn",
            message:
              "shadcn 레지스트리가 넣는 import다. @/shared/lib/utils의 cn을 쓴다.",
          },
        ],
      },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  layerBoundaries,
  designTokens,
  // 포맷은 Prettier가 맡는다. 겹치는 ESLint 규칙을 끈다.
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
