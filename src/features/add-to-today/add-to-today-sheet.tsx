"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { describeSchedule, ZoneBadge } from "@/entities/mission";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";

// S10 오늘 더 하기: 켜진 내 미션 중 오늘 목록에 없는 것을 골라 넣는다.
// 넣은 것은 목록에서 빠지므로 여러 개를 이어서 넣을 수 있다
type Addable = {
  missionId: string;
  name: string;
  zone: { id: string; name: string; icon: string } | null;
  cycleDays: number | null;
  dueDate: string | null;
};

export function AddToTodaySheet({
  addable,
  onAdd,
}: {
  addable: Addable[];
  onAdd: (mission: Addable) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline">
          <Plus aria-hidden data-icon="inline-start" />
          오늘 더 하기
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-dvh overflow-y-auto">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 pb-[calc(--spacing(4)+env(safe-area-inset-bottom))]">
          <SheetHeader className="px-0">
            <SheetTitle>오늘 더 하기</SheetTitle>
            <SheetDescription>
              추천 말고도 하고 싶은 미션을 골라 넣어요. 보상은 하루 10개까지
              모여요.
            </SheetDescription>
          </SheetHeader>
          {addable.length === 0 ? (
            <p className="rounded-xl bg-muted px-4 py-6 text-center text-muted-foreground">
              켜진 미션을 모두 오늘 할 일에 넣었어요.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {addable.map((mission) => (
                <li
                  key={mission.missionId}
                  className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="font-medium">{mission.name}</span>
                    <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <ZoneBadge zone={mission.zone} />
                      {describeSchedule(mission)}
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onAdd(mission)}
                    aria-label={`${mission.name} 오늘 할 일에 넣기`}
                  >
                    넣기
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
