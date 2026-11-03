"use client";

import Link from "next/link";
import { useOptimistic, useState } from "react";
import {
  describeDate,
  describeDay,
  describeDaysAgo,
  MissionCard,
  ZoneBadge,
} from "@/entities/mission";
import {
  CancelConfirmDialog,
  useCancelCompletion,
} from "@/features/cancel-completion";
import { useCompleteMission } from "@/features/complete-mission";
import { DAILY_PERSONAL_REWARD_CAP } from "@/shared/config/constants";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import type { RecordDayData, RecordEntryData, RecordsData } from "./types";

// S16 기록과 S17 날짜별 상세(screen-flow "기록" ⑥ 펼치기). 구역별 마지막으로 한 날과
// 날짜별로 무엇을 추천받고 무엇을 했는지 보여 준다. 오늘 기록만 P04로 취소하고, 취소한 것은
// 다시 완료할 수 있다(기획서 6.5). 지난 날은 바꿀 수 없다

type Change = { missionId: string; status: "done" | "canceled" };

export function RecordsView({ records }: { records: RecordsData }) {
  const [state, apply] = useOptimistic(
    records,
    (current: RecordsData, change: Change): RecordsData => ({
      ...current,
      days: current.days.map((day) =>
        day.date === current.today ? applyToday(day, change) : day,
      ),
    }),
  );
  const [confirmCancel, setConfirmCancel] = useState<RecordEntryData | null>(
    null,
  );

  const { cancel } = useCancelCompletion((missionId) =>
    apply({ missionId, status: "canceled" }),
  );
  const { complete, dialogs } = useCompleteMission({
    date: records.today,
    markDone: (missionId) => apply({ missionId, status: "done" }),
    onUndo: (missionId) => cancel(missionId, records.today),
  });

  return (
    <div className="flex flex-col gap-8">
      {state.zones.length > 0 && (
        <section
          aria-labelledby="zones-heading"
          className="@container flex flex-col gap-3"
        >
          <h2 id="zones-heading" className="text-lg font-semibold">
            구역별 마지막으로 한 날
          </h2>
          {/* 칸 폭이 넓으면 2열(놓인 자리의 폭을 따른다) */}
          <ul className="grid gap-2 @mid:grid-cols-2">
            {state.zones.map(({ zone, lastDoneDate }) => (
              <li
                key={zone.id}
                className="flex min-h-11 items-center justify-between gap-2 rounded-xl border px-3 py-2"
              >
                <ZoneBadge zone={zone} />
                <span className="text-sm text-muted-foreground">
                  {lastDoneDate ? (
                    <>
                      <span className="text-foreground">
                        {describeDaysAgo(lastDoneDate, state.today)}
                      </span>{" "}
                      · {describeDate(lastDoneDate)}
                    </>
                  ) : (
                    "아직 없어요"
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="days-heading" className="flex flex-col gap-3">
        <h2 id="days-heading" className="text-lg font-semibold">
          날짜별 기록
        </h2>
        {state.days.length === 0 ? (
          <NoRecords />
        ) : (
          <ul className="flex flex-col gap-2">
            {state.days.map((day, index) => (
              <li key={day.date}>
                <DayRecord
                  day={day}
                  today={state.today}
                  // 가장 최근 날은 펼쳐 둔다
                  defaultOpen={index === 0}
                  onCancel={setConfirmCancel}
                  onRedo={(entry) => complete(entry.missionId)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <CancelConfirmDialog
        name={confirmCancel?.name ?? ""}
        open={confirmCancel !== null}
        onOpenChange={(open) => !open && setConfirmCancel(null)}
        onConfirm={() => {
          if (confirmCancel) cancel(confirmCancel.missionId, records.today);
        }}
      />
      {dialogs}
    </div>
  );
}

/** 오늘 기록에 낙관적 변경을 적용한다. 보상 수는 서버가 다시 센다 */
function applyToday(day: RecordDayData, change: Change): RecordDayData {
  const target = day.entries.find((e) => e.missionId === change.missionId);
  const allowed =
    change.status === "canceled"
      ? target?.status === "done"
      : target?.status === "canceled";
  if (!target || !allowed) return day;
  return {
    ...day,
    entries: day.entries.map((e) =>
      e === target ? { ...e, status: change.status } : e,
    ),
    rewardCount:
      change.status === "done"
        ? Math.min(day.rewardCount + 1, DAILY_PERSONAL_REWARD_CAP)
        : Math.max(day.rewardCount - 1, 0),
  };
}

function DayRecord({
  day,
  today,
  defaultOpen,
  onCancel,
  onRedo,
}: {
  day: RecordDayData;
  today: string;
  defaultOpen: boolean;
  onCancel: (entry: RecordEntryData) => void;
  onRedo: (entry: RecordEntryData) => void;
}) {
  const isToday = day.date === today;
  const doneCount = day.entries.filter((e) => e.status === "done").length;

  return (
    <details open={defaultOpen} className="rounded-xl border">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 font-medium">
          {describeDay(day.date)}
          {isToday && <Badge variant="secondary">오늘</Badge>}
        </span>
        <span className="text-sm text-muted-foreground">
          완료 {doneCount} · {isToday ? "적립 예정" : "보상"} {day.rewardCount}/
          {DAILY_PERSONAL_REWARD_CAP}
        </span>
      </summary>
      <ul className="flex flex-col gap-2 px-3 pb-3">
        {day.entries.map((entry) => (
          <li key={entry.dailyMissionId} className="grid">
            <MissionCard
              size="compact"
              status={entry.status}
              name={entry.deleted ? `${entry.name} (지운 미션)` : entry.name}
              meta={
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <ZoneBadge zone={entry.zone} />
                  {entry.recommended ? "추천" : "직접 함"} ·{" "}
                  {statusLabel(entry.status, isToday)}
                </span>
              }
              actions={
                isToday && !entry.deleted ? (
                  entry.status === "done" ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onCancel(entry)}
                    >
                      완료 취소
                    </Button>
                  ) : entry.status === "canceled" ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onRedo(entry)}
                    >
                      다시 완료
                    </Button>
                  ) : undefined
                ) : undefined
              }
            />
          </li>
        ))}
      </ul>
    </details>
  );
}

/** 다그치지 않는 상태 문구(원칙 3). 지난 날 하지 않은 것은 "쉬어 갔어요" */
function statusLabel(
  status: RecordEntryData["status"],
  isToday: boolean,
): string {
  switch (status) {
    case "done":
      return "완료";
    case "postponed":
      return "내일로 미룸";
    case "canceled":
      return "완료 취소";
    case "pending":
      return isToday ? "아직" : "쉬어 갔어요";
  }
}

/** E03 기록 없음 */
function NoRecords() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl bg-muted px-4 py-6">
      <p>아직 기록이 없어요.</p>
      <p className="text-sm text-muted-foreground">
        오늘의 추천을 하나 해 보면 여기에 남아요.
      </p>
      <Button asChild variant="outline">
        <Link href="/">오늘의 추천 보기</Link>
      </Button>
    </div>
  );
}
