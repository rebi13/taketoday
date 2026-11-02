"use client";

import { useActionState, useEffect, useState } from "react";
import {
  MISSION_CYCLE_MAX_DAYS,
  MISSION_CYCLE_MIN_DAYS,
} from "@/shared/config/constants";
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
import { Input } from "@/shared/ui/input";
import { changeCycleAction } from "./actions";

// P05 주기 바꾸기. 주기형 미션만 연다. 여는 곳(메뉴)이 open을 쥔다
type Props = {
  missionId: string;
  name: string;
  cycleDays: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChangeCycleDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        {/* 닫았다 열면 입력값과 오류를 처음 상태로 */}
        {props.open && <ChangeCycleForm {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function ChangeCycleForm({ missionId, name, cycleDays, onOpenChange }: Props) {
  const [value, setValue] = useState(String(cycleDays));
  const [state, formAction, pending] = useActionState(changeCycleAction, null);
  const days = Number(value);
  const valid =
    Number.isInteger(days) &&
    days >= MISSION_CYCLE_MIN_DAYS &&
    days <= MISSION_CYCLE_MAX_DAYS;

  useEffect(() => {
    if (state?.status === "saved") onOpenChange(false);
  }, [state, onOpenChange]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>주기 바꾸기</DialogTitle>
        <DialogDescription>
          ‘{name}’ 미션을 며칠마다 할지 정해 주세요. 내 생활에 맞게 바꿔도
          괜찮아요.
        </DialogDescription>
      </DialogHeader>
      <input type="hidden" name="missionId" value={missionId} />
      <label className="flex items-center gap-2">
        <Input
          name="cycleDays"
          type="number"
          inputMode="numeric"
          min={MISSION_CYCLE_MIN_DAYS}
          max={MISSION_CYCLE_MAX_DAYS}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={!valid || undefined}
          aria-describedby="cycle-status"
          className="w-24"
        />
        일마다
      </label>
      <p
        id="cycle-status"
        role="status"
        className="text-sm text-muted-foreground"
      >
        {state?.status === "error"
          ? state.message
          : `${MISSION_CYCLE_MIN_DAYS}~${MISSION_CYCLE_MAX_DAYS}일`}
      </p>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            그대로 두기
          </Button>
        </DialogClose>
        <Button
          type="submit"
          disabled={!valid || days === cycleDays || pending}
        >
          저장
        </Button>
      </DialogFooter>
    </form>
  );
}
