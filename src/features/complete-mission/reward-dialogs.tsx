"use client";

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
import {
  DAILY_PERSONAL_REWARD_CAP,
  MISSION_REWARD,
} from "@/shared/config/constants";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

/** P08 보상은 내일 도착해요. 처음 완료했을 때 한 번만 */
export function FirstCompletionDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>첫 미션을 해냈어요</DialogTitle>
          <DialogDescription>
            보상은 내일 도착해요. 오늘 한 미션은 하나에 {MISSION_REWARD}씩, 하루{" "}
            {DAILY_PERSONAL_REWARD_CAP}개까지 모아 두었다가 다음 날 한꺼번에
            드려요.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">좋아요</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** P03 오늘 보상 다 모았어요. 하루 상한을 채운 완료 때 한 번 */
export function DailyCapDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>오늘 보상을 다 모았어요</DialogTitle>
          <DialogDescription>
            내일 {DAILY_PERSONAL_REWARD_CAP * MISSION_REWARD}이 도착해요. 더
            하고 싶은 미션이 있으면 해도 좋아요. 기록에는 그대로 남아요.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">알겠어요</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
