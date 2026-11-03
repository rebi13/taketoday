"use client";

import { useState } from "react";
import { ChangeCycleDialog } from "@/features/change-mission-cycle";
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
  mission: Pick<MissionDetailData, "id" | "name" | "templateCriteria">;
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
        fromTemplate={mission.templateCriteria !== null}
        open={open}
        onOpenChange={setOpen}
        backToList
      />
    </>
  );
}
