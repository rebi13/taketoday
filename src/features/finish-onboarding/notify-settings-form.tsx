"use client";

import { useActionState, useState } from "react";
import {
  DEFAULT_NOTIFY_TIME,
  EVENING_NOTIFY_CUTOFF,
  EVENING_NOTIFY_TIME,
} from "@/shared/config/constants";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { finishOnboardingAction } from "./actions";

// S07 알림 시간·쉬는 날. 저장하면 고른 조건의 기본 미션이 켜지고 온보딩이 끝난다.
// 알림 예약 자체는 M5에서 붙인다. 알림 허용(S08)은 첫 완료 직후에 묻는다(screen-flow ③).

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function NotifySettingsForm() {
  const [time, setTime] = useState(DEFAULT_NOTIFY_TIME);
  const [state, formAction, pending] = useActionState(
    finishOnboardingAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <label htmlFor="notify-time" className="font-medium">
          매일 알림 받을 시간
        </label>
        <Input
          id="notify-time"
          name="notifyTime"
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          required
          aria-describedby="notify-time-hint"
        />
        <p id="notify-time-hint" className="text-sm text-muted-foreground">
          이 시간에 오늘의 미션을 알려 드려요.{" "}
          {time >= EVENING_NOTIFY_CUTOFF
            ? "저녁 알림과 가까워서 저녁 알림은 따로 보내지 않아요."
            : `남은 미션이 있으면 ${EVENING_NOTIFY_TIME.slice(0, 2)}시에 한 번 더 알려 드려요.`}
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-medium">쉬는 날</legend>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((label, weekday) => (
            <label
              key={label}
              className="flex h-11 cursor-pointer items-center justify-center rounded-lg bg-card text-sm font-medium ring-1 ring-foreground/10 transition-shadow duration-(--duration-fast) has-checked:bg-primary has-checked:text-primary-foreground has-checked:ring-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
            >
              <input
                type="checkbox"
                name="restDays"
                value={weekday}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          쉬는 날에는 알림을 보내지 않아요. 미션은 그대로 볼 수 있어요.
        </p>
      </fieldset>

      <Button type="submit" size="lg" disabled={!time || pending}>
        시작하기
      </Button>
      {state?.error && (
        <p role="alert" className="text-center text-sm text-muted-foreground">
          {state.error}
        </p>
      )}
    </form>
  );
}
