"use client";

import { Coins } from "lucide-react";
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

export type RewardArrivalData = {
  /** 보상이 있는 날 수 */
  days: number;
  amount: number;
};

/**
 * P09 어제 보상 도착(기획서 6.1, screen-flow "앱 열기").
 * 동전이 살짝 커지며 나타난다. 보상 연출이라 모션을 쓰고, 움직임 줄이기면 0ms(--duration-reward)
 */
export function RewardArrivalDialog({
  arrival,
  open,
  onOpenChange,
}: {
  arrival: RewardArrivalData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // 하루면 "어제", 며칠 만에 왔으면 모아서 한 번에
  const title =
    arrival.days === 1
      ? `어제 보상 +${arrival.amount} 도착`
      : `지난 보상 +${arrival.amount} 도착`;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="items-center text-center">
          <span
            aria-hidden
            className="mb-2 flex size-16 animate-in items-center justify-center rounded-full bg-primary/15 text-primary duration-(--duration-reward) zoom-in-50 fade-in"
          >
            <Coins className="size-8" />
          </span>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {arrival.days === 1
              ? "어제 한 미션의 보상이 들어왔어요. 오늘도 하나씩 해 봐요."
              : `${arrival.days}일 동안 한 미션의 보상을 모아 드렸어요.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">받았어요</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
