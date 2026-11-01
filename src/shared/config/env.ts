import "server-only";
import { z } from "zod";

// 서버 환경변수. 값을 어디서 받는지는 docs/setup.md를 본다.
// 빌드(CI 포함)에는 비밀값이 없으므로 import 시점이 아니라 처음 쓸 때 검증한다.
const serverEnvSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  AUTH_SECRET: z.string().min(32),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const keys = [...new Set(result.error.issues.map((i) => i.path.join(".")))];
    throw new Error(
      `환경변수가 없거나 형식이 틀렸다: ${keys.join(", ")}. docs/setup.md를 본다.`,
    );
  }
  cached = result.data;
  return cached;
}
