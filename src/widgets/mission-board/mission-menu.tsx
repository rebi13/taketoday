"use client";

import { EllipsisVertical } from "lucide-react";
import { useState } from "react";
import { ChangeCycleDialog } from "@/features/change-mission-cycle";
import { DeleteMissionDialog } from "@/features/delete-mission";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import type { BoardMission } from "./types";

// S11 카드의 더 보기 메뉴: P05 주기 바꾸기(주기형만), P06 삭제
export function MissionMenu({ mission }: { mission: BoardMission }) {
  const [dialog, setDialog] = useState<"cycle" | "delete" | null>(null);
  const close = (open: boolean) => {
    if (!open) setDialog(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`${mission.name} 더 보기`}
          >
            <EllipsisVertical aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto">
          {mission.cycleDays !== null && (
            <DropdownMenuItem onSelect={() => setDialog("cycle")}>
              주기 바꾸기
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDialog("delete")}
          >
            지우기
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {mission.cycleDays !== null && (
        <ChangeCycleDialog
          missionId={mission.id}
          name={mission.name}
          cycleDays={mission.cycleDays}
          open={dialog === "cycle"}
          onOpenChange={close}
        />
      )}
      <DeleteMissionDialog
        missionId={mission.id}
        name={mission.name}
        fromTemplate={mission.fromTemplate}
        open={dialog === "delete"}
        onOpenChange={close}
      />
    </>
  );
}
