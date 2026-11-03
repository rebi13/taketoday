"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useState } from "react";
import {
  CheckCriteriaDialog,
  describeDate,
  describeSchedule,
  isPastDue,
  MissionCard,
  ZoneBadge,
} from "@/entities/mission";
import { PendingRewardMeter } from "@/entities/wallet";
import {
  CancelConfirmDialog,
  useCancelCompletion,
} from "@/features/cancel-completion";
import { useCompleteMission } from "@/features/complete-mission";
import { EditCriteriaSheet } from "@/features/edit-check-criteria";
import { AddToTodaySheet, useTodayList } from "@/features/add-to-today";
import { usePostponeMission } from "@/features/postpone-mission";
import { OverdueMissionDialog } from "@/features/review-overdue-mission";
import { DAILY_PERSONAL_REWARD_CAP } from "@/shared/config/constants";
import { Button } from "@/shared/ui/button";
import type { TodayData, TodayMissionData } from "./types";

// S10 홈의 오늘의 추천과 적립 예정 n/10(screen-flow "하루 흐름").
// 완료·내일로·되돌리기는 서버 응답을 기다리지 않고 먼저 표시한다(useOptimistic, ADR 0009).
// 되돌린(취소한) 미션은 같은 날 "다시 완료"할 수 있다(기획서 6.5).
// 카드를 누르면 P01 완료 기준 보기, 거기서도 완료·내 기준으로 바꾸기를 할 수 있다.
// 완료한 카드의 P01에는 "완료 취소"가 있다(P04로 한 번 묻는다).
// 마감이 지난 기한형 미션은 카드의 "정리"로 P07을 연다(계속 · 끝내기 · 삭제).
// 추천 말고도 "오늘 더 하기"로 내 미션을 넣어 할 수 있다(기획서 6.2). 넣은 것과
// 미션 상세에서 직접 한 것은 "오늘 더 한 미션"에 모인다

type Change =
  | { missionId: string; status: "done" | "postponed" | "canceled" }
  /** P07에서 끝내거나 지워 오늘 목록에서 빠진다 */
  | { missionId: string; status: "left" }
  /** 오늘 더 하기로 넣었다 / 넣은 것을 뺐다 */
  | { missionId: string; status: "added" | "removed" };

/** 지금 상태에서 그 변경을 할 수 있는가. 완료는 아직 안 한 것만, 취소는 완료한 것만 */
const ALLOWED: Record<
  "done" | "postponed" | "canceled",
  TodayMissionData["status"][]
> = {
  done: ["pending", "postponed", "canceled"],
  postponed: ["pending"],
  canceled: ["done"],
};

export function TodayRecommendations({ today }: { today: TodayData }) {
  const [state, apply] = useOptimistic(
    today,
    (current: TodayData, change: Change): TodayData => {
      const { missionId } = change;
      const others = <T extends { missionId: string }>(list: T[]) =>
        list.filter((m) => m.missionId !== missionId);
      if (change.status === "added") {
        const info = current.addable.find((m) => m.missionId === missionId);
        if (!info) return current;
        return {
          ...current,
          extra: [...current.extra, { ...info, status: "pending" }],
          addable: others(current.addable),
        };
      }
      const target = [...current.missions, ...current.extra].find(
        (m) => m.missionId === missionId,
      );
      if (!target) return current;
      if (change.status === "removed") {
        return {
          ...current,
          extra: others(current.extra),
          addable: [...current.addable, target],
        };
      }
      if (change.status === "left") {
        return {
          ...current,
          missions: others(current.missions),
          extra: others(current.extra),
        };
      }
      if (!ALLOWED[change.status].includes(target.status)) return current;
      const status = change.status;
      const update = (list: TodayMissionData[]) =>
        list.map((m) => (m.missionId === missionId ? { ...m, status } : m));
      return {
        ...current,
        missions: update(current.missions),
        extra: update(current.extra),
        // 정확한 수는 서버가 다시 센다(상한을 넘긴 완료는 세지 않는다). 먼저 어림해 둔다
        pendingRewards:
          status === "done"
            ? Math.min(current.pendingRewards + 1, DAILY_PERSONAL_REWARD_CAP)
            : status === "canceled"
              ? Math.max(current.pendingRewards - 1, 0)
              : current.pendingRewards,
      };
    },
  );
  /** 방금 완료한 카드(P02 짧은 연출) */
  const [justDone, setJustDone] = useState<string | null>(null);
  const [opened, setOpened] = useState<string | null>(null);
  /** P04로 취소를 묻고 있는 미션 */
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  /** P07로 계속할지 묻고 있는 기한 지난 미션 */
  const [reviewing, setReviewing] = useState<string | null>(null);

  const { cancel } = useCancelCompletion((missionId) => {
    apply({ missionId, status: "canceled" });
    setJustDone(null);
  });
  const { complete, dialogs } = useCompleteMission({
    date: today.date,
    markDone: (missionId) => {
      apply({ missionId, status: "done" });
      setJustDone(missionId);
    },
    onUndo: (missionId) => cancel(missionId, today.date),
  });
  const { postpone } = usePostponeMission((missionId) =>
    apply({ missionId, status: "postponed" }),
  );
  const { add, remove } = useTodayList({
    markAdded: (missionId) => apply({ missionId, status: "added" }),
    markRemoved: (missionId) => apply({ missionId, status: "removed" }),
  });
  const all = [...state.missions, ...state.extra];
  const openedMission = all.find((m) => m.missionId === opened);
  const cancelTarget = all.find((m) => m.missionId === confirmCancel);
  const reviewTarget = all.find((m) => m.missionId === reviewing);
  const overdue = (mission: TodayMissionData) =>
    mission.dueDate !== null &&
    mission.status !== "done" &&
    isPastDue(mission.dueDate, today.date);

  const renderCard = (mission: TodayMissionData, extra = false) => (
    <MissionCard
      status={mission.status}
      name={mission.name}
      onSelect={() => setOpened(mission.missionId)}
      meta={<Meta mission={mission} overdue={overdue(mission)} />}
      actions={
        <CardActions
          mission={mission}
          overdue={overdue(mission)}
          onComplete={() => complete(mission.missionId)}
          // 넣은 것은 "빼기", 추천받은 것은 "내일로"
          secondary={
            extra
              ? { label: "빼기", onClick: () => remove(mission.missionId) }
              : { label: "내일로", onClick: () => postpone(mission.missionId) }
          }
          onReview={() => setReviewing(mission.missionId)}
        />
      }
    />
  );

  return (
    <section aria-label="오늘의 추천" className="flex flex-col gap-4">
      <PendingRewardMeter count={state.pendingRewards} />

      <h2 className="text-lg font-semibold">오늘의 추천</h2>
      {state.missions.length === 0 ? (
        <NoRecommendations />
      ) : (
        <MissionList
          missions={state.missions}
          justDone={justDone}
          render={(mission) => renderCard(mission)}
        />
      )}

      {state.extra.length > 0 && (
        <>
          <h2 className="text-lg font-semibold">오늘 더 한 미션</h2>
          <MissionList
            missions={state.extra}
            justDone={justDone}
            render={(mission) => renderCard(mission, true)}
          />
        </>
      )}
      <div>
        <AddToTodaySheet
          addable={state.addable}
          onAdd={(mission) => add(mission.missionId, mission.name)}
        />
      </div>

      {openedMission && (
        <CheckCriteriaDialog
          open
          onOpenChange={(open) => !open && setOpened(null)}
          name={openedMission.name}
          checkCriteria={openedMission.checkCriteria}
          extra={
            <EditCriteriaSheet
              missionId={openedMission.missionId}
              checkCriteria={openedMission.checkCriteria}
              userModified={openedMission.userModified}
              templateCriteria={openedMission.templateCriteria}
            />
          }
          actions={
            openedMission.status === "done" ? (
              // 완료 알림(T01)을 놓쳐도 그날 안에는 여기서 취소한다. P04로 한 번 묻는다
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpened(null);
                  setConfirmCancel(openedMission.missionId);
                }}
              >
                완료 취소
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  setOpened(null);
                  complete(openedMission.missionId);
                }}
              >
                {openedMission.status === "canceled" ? "다시 완료" : "완료"}
              </Button>
            )
          }
        />
      )}
      <CancelConfirmDialog
        name={cancelTarget?.name ?? ""}
        open={cancelTarget !== undefined}
        onOpenChange={(open) => !open && setConfirmCancel(null)}
        onConfirm={() => {
          if (cancelTarget) cancel(cancelTarget.missionId, today.date);
        }}
      />
      {reviewTarget?.dueDate && (
        <OverdueMissionDialog
          open
          onOpenChange={(open) => !open && setReviewing(null)}
          missionId={reviewTarget.missionId}
          name={reviewTarget.name}
          dueLabel={describeDate(reviewTarget.dueDate)}
          onLeave={(missionId) => apply({ missionId, status: "left" })}
        />
      )}
      {dialogs}
    </section>
  );
}

function Meta({
  mission,
  overdue,
}: {
  mission: TodayMissionData;
  overdue: boolean;
}) {
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <ZoneBadge zone={mission.zone} />
      {mission.status === "postponed"
        ? "내일 다시 추천할게요"
        : mission.status === "canceled"
          ? "완료를 취소했어요. 오늘 안에 다시 할 수 있어요"
          : overdue
            ? `${describeSchedule(mission)} · 기한이 지났어요`
            : describeSchedule(mission)}
    </span>
  );
}

/** 카드 목록. 방금 완료한 카드만 살짝 커졌다 돌아온다(P02, 움직임 줄이기면 0ms) */
function MissionList({
  missions,
  justDone,
  render,
}: {
  missions: TodayMissionData[];
  justDone: string | null;
  render: (mission: TodayMissionData) => React.ReactNode;
}) {
  return (
    <ul className="grid gap-3">
      {missions.map((mission) => (
        <li
          key={mission.missionId}
          className={
            justDone === mission.missionId && mission.status === "done"
              ? "grid animate-in duration-(--duration-reward) zoom-in-95"
              : "grid"
          }
        >
          {render(mission)}
        </li>
      ))}
    </ul>
  );
}

function CardActions({
  mission,
  overdue,
  onComplete,
  secondary,
  onReview,
}: {
  mission: TodayMissionData;
  /** 마감이 지난 기한형: 내일로·빼기 대신 P07 "정리" */
  overdue: boolean;
  onComplete: () => void;
  /** 아직 안 한 카드의 보조 동작(추천: 내일로, 오늘 더 하기: 빼기) */
  secondary: { label: string; onClick: () => void };
  onReview: () => void;
}) {
  if (overdue && mission.status !== "canceled") {
    return (
      <div className="flex gap-1">
        <Button type="button" variant="ghost" onClick={onReview}>
          정리
        </Button>
        <Button type="button" onClick={onComplete}>
          완료
        </Button>
      </div>
    );
  }
  switch (mission.status) {
    case "done":
      return (
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Check aria-hidden className="size-4" />
          완료
        </span>
      );
    case "canceled":
      return (
        <Button type="button" variant="outline" onClick={onComplete}>
          다시 완료
        </Button>
      );
    case "postponed":
      return (
        <Button type="button" variant="outline" onClick={onComplete}>
          완료
        </Button>
      );
    case "pending":
      return (
        <div className="flex gap-1">
          <Button type="button" variant="ghost" onClick={secondary.onClick}>
            {secondary.label}
          </Button>
          <Button type="button" onClick={onComplete}>
            완료
          </Button>
        </div>
      );
  }
}

/** E01 오늘 추천 없음 → 미션 목록 */
function NoRecommendations() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl bg-muted px-4 py-6">
      <p>오늘은 꼭 할 때가 된 미션이 없어요.</p>
      <p className="text-sm text-muted-foreground">
        쉬어 가도 좋아요. 할 때가 된 미션이 생기면 여기에 나와요.
      </p>
      <Button asChild variant="outline">
        <Link href="/missions">내 미션 보기</Link>
      </Button>
    </div>
  );
}
