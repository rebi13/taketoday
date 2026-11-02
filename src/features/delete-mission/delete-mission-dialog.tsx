"use client";

import { useState, useTransition } from "react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { deleteMissionAction } from "./actions";

// P06 미션 삭제 확인. 지워도 지난 기록은 남는다(소프트 삭제)
type Props = {
  missionId: string;
  name: string;
  /** 기본 미션이면 S15에서 다시 켤 수 있다고 알려준다 */
  fromTemplate: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteMissionDialog({
  missionId,
  name,
  fromTemplate,
  open,
  onOpenChange,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setFailed(false);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>‘{name}’ 미션을 지울까요?</DialogTitle>
          <DialogDescription>
            지금까지 한 기록은 그대로 남아요.
            {fromTemplate
              ? " 다시 하고 싶으면 기본 미션 더 보기에서 켤 수 있어요."
              : " 꺼 두기만 하면 나중에 다시 켤 수 있어요."}
          </DialogDescription>
        </DialogHeader>
        {failed && (
          <p role="alert" className="text-sm text-muted-foreground">
            지우지 못했어요. 잠시 뒤에 다시 해 주세요.
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              그대로 두기
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const ok = await deleteMissionAction(missionId);
                if (ok) onOpenChange(false);
                else setFailed(true);
              })
            }
          >
            지우기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
