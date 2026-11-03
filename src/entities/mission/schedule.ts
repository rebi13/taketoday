// 미션 주기·마감을 화면 문구로 바꾼다. 날짜 계산은 하지 않고 표시만 한다.

/** 1 → "매일", 7 → "7일마다" */
export function describeCycle(cycleDays: number): string {
  return cycleDays === 1 ? "매일" : `${cycleDays}일마다`;
}

/** "2026-11-10" → "11월 10일" */
export function describeDate(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  return `${month}월 ${day}일`;
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
