import "server-only";

/**
 * Postgres 유니크 제약 위반(23505)인가. constraint를 주면 그 제약일 때만 true.
 * Drizzle은 드라이버 오류를 cause에 감싸 던지므로 둘 다 본다.
 */
export function isUniqueViolation(error: unknown, constraint?: string) {
  for (const e of [error, (error as { cause?: unknown })?.cause]) {
    const pg = e as { code?: string; constraint?: string } | undefined;
    if (pg?.code === "23505") {
      return constraint === undefined || pg.constraint === constraint;
    }
  }
  return false;
}
