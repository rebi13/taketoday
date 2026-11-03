"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { deleteOverdueMissionAction, endOverdueMissionAction } from "./actions";

// P07 기한 지난 미션: 계속 · 끝내기 · 삭제(기획서 15.1, 원칙 3 "벌칙 없음").
// 마감이 지나도 다그치지 않고 아직 할지만 묻는다. 계속하면 그대로 추천에 남는다
export function OverdueMissionDialog({
  missionId,
  name,
  dueLabel,
  open,
  onOpenChange,
  onLeave,
}: {
  missionId: string;
  name: string;
  /** "11월 1일" */
  dueLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 끝내거나 지워 오늘 목록에서 빠질 때(낙관적 갱신, 트랜잭션 안에서 부른다) */
  onLeave: (missionId: string) => void;
}) {
  const [pending, startTransition] = useTransition();

  const run = (
    action: (id: string) => Promise<boolean>,
    done: string,
    failed: string,
  ) =>
    startTransition(async () => {
      onOpenChange(false);
      onLeave(missionId);
      if (await action(missionId)) toast(done);
      else toast.error(failed);
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>기한이 지났어요</DialogTitle>
          <DialogDescription>
            ‘{name}’ 미션은 {dueLabel}까지였어요. 아직 하실 건가요? 늦어도
            괜찮아요.
          </DialogDescription>
        </DialogHeader>
        {/* 세 가지 중 하나를 고르는 자리라 넓은 화면에서도 위아래로 쌓는다 */}
        <div className="flex flex-col gap-2">
          <DialogClose asChild>
            <Button type="button">계속 챙길게요</Button>
          </DialogClose>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() =>
              run(
                endOverdueMissionAction,
                "꺼 두었어요. 내 미션에서 다시 켤 수 있어요",
                "바꾸지 못했어요. 잠시 뒤에 다시 해 주세요",
              )
            }
          >
            이제 안 해도 돼요
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() =>
              run(
                deleteOverdueMissionAction,
                "미션을 지웠어요. 기록에는 남아요",
                "지우지 못했어요. 잠시 뒤에 다시 해 주세요",
              )
            }
          >
            미션 지우기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
