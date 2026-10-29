// 커밋 규칙: docs/commit-convention.md
// scope를 추가하면 문서 3장 표도 같은 커밋에서 고친다.

/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "missions",
        "recommendations",
        "completions",
        "settlement",
        "wallet",
        "shop",
        "room",
        "character",
        "onboarding",
        "notifications",
        "pwa",
        "ai",
        "auth",
        "jobs",
        "db",
        "seed",
        "ui",
        "layout",
        "adr",
        "deps",
      ],
    ],
    // 한국어 제목이라 대소문자 규칙은 의미가 없다.
    "subject-case": [0],
    "header-max-length": [2, "always", 72],
    "body-max-line-length": [1, "always", 100],
    // 진행 단위 표시 금지 (문서 7장)
    "no-progress-markers": [2, "always"],
  },
  plugins: [
    {
      rules: {
        "no-progress-markers": ({ header, body }) => {
          const text = `${header ?? ""}\n${body ?? ""}`;
          const pattern =
            /\b(M[0-7]|Phase\s*\d|round[\s-]*\d+|PR\s*#\d+|issue\s*#\d+|WIP)\b|리뷰\s*반영/i;
          const found = text.match(pattern);
          return [
            !found,
            found
              ? `진행 단위 표시 "${found[0]}"를 빼고 무엇을 왜 바꿨는지 쓴다 (docs/commit-convention.md 7장)`
              : "",
          ];
        },
      },
    },
  ],
};

export default config;
