"use client";

import type { ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";

// P01 완료 기준 보기. 홈 추천 카드(#20) 같은 곳에서 기준만 잠깐 볼 때 연다
export function CheckCriteriaDialog({
  name,
  checkCriteria,
  children,
}: {
  name: string;
  checkCriteria: string;
  /** 여는 버튼 */
  children: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>이만큼 하면 완료</DialogDescription>
        </DialogHeader>
        <p className="text-base">{checkCriteria}</p>
        <p className="text-sm text-muted-foreground">
          더 하고 싶으면 더 해도 좋아요. 이만큼만 해도 오늘 할 일은 한 거예요.
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">알겠어요</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
