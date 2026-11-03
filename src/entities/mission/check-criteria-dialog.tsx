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

// P01 완료 기준 보기. 여는 버튼(children)을 주거나, 여는 쪽이 open을 쥔다(홈 추천 카드).
// actions를 주면 "알겠어요" 대신 그 동작(완료·내 기준으로 바꾸기)을 아래에 놓는다
export function CheckCriteriaDialog({
  name,
  checkCriteria,
  children,
  open,
  onOpenChange,
  actions,
  extra,
}: {
  name: string;
  checkCriteria: string;
  /** 여는 버튼 */
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 아래 버튼들. 없으면 "알겠어요" */
  actions?: ReactNode;
  /** 기준 아래에 덧붙일 것(내 기준으로 바꾸기 등) */
  extra?: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>이만큼 하면 완료</DialogDescription>
        </DialogHeader>
        <p className="text-base">{checkCriteria}</p>
        <p className="text-sm text-muted-foreground">
          더 하고 싶으면 더 해도 좋아요. 이만큼만 해도 오늘 할 일은 한 거예요.
        </p>
        {extra}
        <DialogFooter>
          {actions ?? (
            <DialogClose asChild>
              <Button type="button">알겠어요</Button>
            </DialogClose>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
