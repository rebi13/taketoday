import { timingSafeEqual } from "node:crypto";
import { runDailyJob } from "@/server/services";
import { serverEnv } from "@/shared/config/env";

// 매일 작업(Vercel Cron, vercel.json crons). 미정산 날 정산 → (M5) 알림 예약 → (#40) 탈퇴 파기.
// Vercel Cron은 Authorization: Bearer <CRON_SECRET>을 붙여 GET으로 부른다.
// 비밀값이 없거나 틀리면 아무것도 하지 않는다. 여러 번 불려도 결과가 같다(CLAUDE.md "예약 작업")
export async function GET(request: Request) {
  if (!isAuthorized(request.headers.get("authorization"))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runDailyJob();
  return Response.json(result);
}

function isAuthorized(header: string | null): boolean {
  const secret = serverEnv().CRON_SECRET;
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  // 길이가 다르면 timingSafeEqual이 던지므로 먼저 거른다
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}
