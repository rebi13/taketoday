import { TZDate } from "@date-fns/tz";
import { z } from "zod";
import { SERVICE_TIME_ZONE } from "@/shared/config/constants";

// 서비스의 "하루"는 서울 기준 날짜 문자열(YYYY-MM-DD) 하나로만 다룬다.
// 날짜를 자르거나 더하는 코드는 이 파일에만 둔다. new Date()를 직접 자르면
// 서버(UTC)와 기기의 시간대에 따라 날짜가 달라진다.

/** 서울 기준 날짜. 예: "2026-11-01" */
export type LocalDate = string;

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** YYYY-MM-DD 형식이고 실제로 있는 날짜인가("2026-02-30"은 아니다) */
export function isLocalDate(value: string): value is LocalDate {
  if (!LOCAL_DATE_PATTERN.test(value)) return false;
  return toUtcDate(value).toISOString().startsWith(value);
}

export const localDateSchema = z
  .string()
  .refine(isLocalDate, "YYYY-MM-DD 형식의 있는 날짜여야 한다");

/** 그 시각이 서울 기준으로 며칠인가. 기본은 지금 */
export function localDate(at: Date = new Date()): LocalDate {
  const seoul = new TZDate(at.getTime(), SERVICE_TIME_ZONE);
  return formatParts(
    seoul.getFullYear(),
    seoul.getMonth() + 1,
    seoul.getDate(),
  );
}

/** 날짜에 n일을 더한다(음수면 뺀다). 달·해가 바뀌어도 맞는다 */
export function addDays(date: LocalDate, days: number): LocalDate {
  const d = toUtcDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return formatParts(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** to − from 일수. 같은 날이면 0, to가 이전이면 음수 */
export function diffDays(from: LocalDate, to: LocalDate): number {
  const MS_PER_DAY = 86_400_000;
  return Math.round(
    (toUtcDate(to).getTime() - toUtcDate(from).getTime()) / MS_PER_DAY,
  );
}

/** 요일. 0 = 일요일 … 6 = 토요일 (쉬는 날 판정용) */
export function weekdayOf(date: LocalDate): number {
  return toUtcDate(date).getUTCDay();
}

// 날짜 문자열만 계산할 때는 시간대가 끼어들지 않게 UTC 자정으로 다룬다
function toUtcDate(date: LocalDate): Date {
  const m = LOCAL_DATE_PATTERN.exec(date);
  if (!m) throw new Error(`날짜 형식이 아니다: ${date}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

function formatParts(year: number, month: number, day: number): LocalDate {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}
