"use client";

import { Check } from "lucide-react";
import { useOptimistic, useState } from "react";
import { useCancelCompletion } from "@/features/cancel-completion";
import { ChangeCycleDialog } from "@/features/change-mission-cycle";
import { useCompleteMission } from "@/features/complete-mission";
import { DeleteMissionDialog } from "@/features/delete-mission";
import { Button } from "@/shared/ui/button";
import type { MissionDetailData } from "./types";

// S12의 P05 주기 바꾸기 버튼(주기형만)
export function ChangeCycleButton({
  mission,
}: {
  mission: Pick<MissionDetailData, "id" | "name" | "cycleDays">;
}) {
  const [open, setOpen] = useState(false);
  if (mission.cycleDays === null) return null;
  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        주기 바꾸기
      </Button>
      <ChangeCycleDialog
        missionId={mission.id}
        name={mission.name}
        cycleDays={mission.cycleDays}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

// S12의 P06 삭제. 지우면 목록(S11)으로 돌아간다
export function DeleteMissionButton({
  mission,
}: {
  mission: Pick<MissionDetailData, "id" | "name" | "fromTemplate">;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
        미션 지우기
      </Button>
      <DeleteMissionDialog
        missionId={mission.id}
        name={mission.name}
        fromTemplate={mission.fromTemplate}
        open={open}
        onOpenChange={setOpen}
        backToList
      />
    </>
  );
}

// S12 오늘 했어요: 추천에 없어도 바로 완료로 남긴다(기획서 6.2). 홈의 "오늘 더 한 미션"과
// 적립 예정 n/10에 함께 잡힌다. T01 되돌리기로 바로 취소할 수 있다
export function DoneTodayButton({
  mission,
}: {
  mission: Pick<MissionDetailData, "id" | "today" | "doneToday">;
}) {
  const [doneToday, setDoneToday] = useOptimistic(mission.doneToday);
  const { cancel } = useCancelCompletion(() => setDoneToday(false));
  const { complete, dialogs } = useCompleteMission({
    date: mission.today,
    markDone: () => setDoneToday(true),
    onUndo: (missionId) => cancel(missionId, mission.today),
  });

  return (
    <>
      {doneToday ? (
        <p className="flex min-h-11 items-center gap-2 text-muted-foreground">
          <Check aria-hidden className="size-4" />
          오늘 했어요
        </p>
      ) : (
        <Button type="button" onClick={() => complete(mission.id)}>
          오늘 했어요
        </Button>
      )}
      {dialogs}
    </>
  );
}
