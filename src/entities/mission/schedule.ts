import { diffDays, weekdayOf } from "@/shared/lib/date";

// 미션 주기·마감·날짜를 화면 문구로 바꾼다. 날짜 계산은 shared/lib/date에 맡긴다.

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 1 → "매일", 7 → "7일마다" */
export function describeCycle(cycleDays: number): string {
  return cycleDays === 1 ? "매일" : `${cycleDays}일마다`;
}

/** "2026-11-10" → "11월 10일" */
export function describeDate(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  return `${month}월 ${day}일`;
}

/** "2026-11-03" → "11월 3일 (화)" */
export function describeDay(date: string): string {
  return `${describeDate(date)} (${WEEKDAYS[weekdayOf(date)]})`;
}

/** 오늘 기준으로 며칠 전인가: "오늘" · "어제" · "n일 전" */
export function describeDaysAgo(date: string, today: string): string {
  const days = diffDays(date, today);
  if (days <= 0) return "오늘";
  if (days === 1) return "어제";
  return `${days}일 전`;
}

/** 마감이 지났는가(오늘 마감은 아직) */
export function isPastDue(dueDate: string, today: string): boolean {
  return diffDays(today, dueDate) < 0;
}

/** "2026-11-10" → "11월 10일까지" */
export function describeDue(dueDate: string): string {
  return `${describeDate(dueDate)}까지`;
}

export function describeSchedule(mission: {
  cycleDays: number | null;
  dueDate: string | null;
}): string {
  if (mission.cycleDays !== null) return describeCycle(mission.cycleDays);
  if (mission.dueDate !== null) return describeDue(mission.dueDate);
  return "";
}
