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

// P04 완료 취소 확인. 홈 P01의 "완료 취소"와 기록 화면(S17)에서 쓴다.
// 완료 알림(T01)의 되돌리기는 누른 직후라 묻지 않는다
export function CancelConfirmDialog({
  name,
  open,
  onOpenChange,
  onConfirm,
}: {
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>완료를 취소할까요?</DialogTitle>
          <DialogDescription>
            ‘{name}’ 미션이 적립 예정에서 빠져요. 오늘 안에는 다시 완료할 수
            있어요.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              그대로 두기
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            완료 취소
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
