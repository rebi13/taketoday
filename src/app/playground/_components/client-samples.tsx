"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCriteriaField } from "@/entities/mission";
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
