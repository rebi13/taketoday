"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCriteriaField, MissionCard } from "@/entities/mission";
import {
  DailyCapDialog,
  FirstCompletionDialog,
} from "@/features/complete-mission";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

// 상태를 쥐어야 보이는 견본(갤러리는 서버 컴포넌트라 여기에 둔다)

export function SelectSample() {
  return (
    <Select defaultValue="desk">
      <SelectTrigger aria-label="구역" className="w-full mid:w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">구역 없음</SelectItem>
        <SelectItem value="desk">책상·작업공간</SelectItem>
        <SelectItem value="bath">욕실</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function ToastSample() {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => toast.success("저장했어요")}
    >
      T04 저장했어요 띄우기
    </Button>
  );
}

export function CheckCriteriaFieldSample() {
  const [value, setValue] = useState("세면대가 깨끗해지면");
  return (
    <CheckCriteriaField
      id="playground-criteria"
      name="checkCriteria"
      value={value}
      onChange={setValue}
    />
  );
}

export function RewardDialogsSample() {
  const [open, setOpen] = useState<"first" | "cap" | null>(null);
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={() => setOpen("first")}>
        P08 첫 완료
      </Button>
      <Button type="button" variant="outline" onClick={() => setOpen("cap")}>
        P03 보상 다 모음
      </Button>
      <FirstCompletionDialog
        open={open === "first"}
        onOpenChange={(next) => !next && setOpen(null)}
      />
      <DailyCapDialog
        open={open === "cap"}
        onOpenChange={(next) => !next && setOpen(null)}
      />
    </div>
  );
}

export function SelectableMissionCardSample() {
  const [count, setCount] = useState(0);
  return (
    <MissionCard
      status="pending"
      name={`onSelect · 카드를 누르면 ${count}번`}
      meta="매일"
      onSelect={() => setCount((n) => n + 1)}
      actions={
        <div className="flex gap-1">
          <Button type="button" variant="ghost">
            내일로
          </Button>
          <Button type="button">완료</Button>
        </div>
      }
    />
  );
}
