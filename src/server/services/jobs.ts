import "server-only";
import { getDb } from "@/server/db";
import { localDate } from "@/shared/lib/date";
import { settleAllPending, type DailySettlementRun } from "./settle-days";

// 예약 작업(구현 계획 2.1, ADR 0004). 요청 검증은 부르는 Route Handler가 한다.

export type DailyJobResult = {
  /** 서울 기준 오늘. 이 날 전까지를 정산한다 */
  today: string;
  settlement: DailySettlementRun;
};

/**
 * /api/jobs/daily(Vercel Cron, 하루 1회 00:05 KST 전후). 접속하지 않은 사용자의 미정산 날을 정산한다.
 * 여러 번 돌아도 결과가 같다. 다음 24시간 알림 예약은 M5(#34), 탈퇴 30일 경과 파기는 #40에서 여기에 붙인다
 */
export async function runDailyJob(): Promise<DailyJobResult> {
  const today = localDate();
  const settlement = await settleAllPending(getDb(), today);
  return { today, settlement };
}
