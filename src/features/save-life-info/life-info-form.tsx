"use client";

import { useActionState, useState } from "react";
import {
  CONDITION_TAGS,
  HOUSEHOLDS,
  type ConditionTag,
  type Household,
} from "@/shared/config/constants";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { saveLifeInfoAction } from "./actions";

// S05 생활 정보. 고른 조건에 따라 처음 켜질 미션을 바로 보여준다(S06을 합침, screen-flow ②).

const HOUSEHOLD_LABELS: Record<Household, string> = {
  solo: "혼자 살아요",
  shared: "함께 살아요",
};

const CONDITION_LABELS: Record<ConditionTag, string> = {
  pet: "반려동물과 살아요",
  plant: "화분·식물을 키워요",
  car: "차가 있어요",
  aircon: "에어컨이 있어요",
  humidifier: "가습기를 써요",
};

type Candidate = {
  id: string;
  name: string;
  zoneName: string;
  conditionTags: string[];
};

export function LifeInfoForm({ candidates }: { candidates: Candidate[] }) {
  const [household, setHousehold] = useState<Household | null>(null);
  const [tags, setTags] = useState<ConditionTag[]>([]);
  const [state, formAction, pending] = useActionState(saveLifeInfoAction, null);

  // 서버의 pickStartingTemplates와 같은 규칙: 조건이 모두 고른 것에 드는 기본 미션
  const starting = candidates.filter((c) =>
    c.conditionTags.every((tag) => tags.includes(tag as ConditionTag)),
  );

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 font-medium">어떻게 지내요?</legend>
        <div className="grid grid-cols-2 gap-3">
          {HOUSEHOLDS.map((value) => (
            <label
              key={value}
              className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-card px-3 py-3 font-medium ring-1 ring-foreground/10 transition-shadow duration-(--duration-fast) has-checked:ring-2 has-checked:ring-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
            >
              <input
                type="radio"
                name="household"
                value={value}
                checked={household === value}
                onChange={() => setHousehold(value)}
                className="sr-only"
              />
              {HOUSEHOLD_LABELS[value]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 font-medium">
          해당하는 것을 모두 골라 주세요
        </legend>
        <p className="mb-2 text-sm text-muted-foreground">
          없으면 고르지 않아도 돼요.
        </p>
        {CONDITION_TAGS.map((tag) => (
          <label key={tag} className="flex min-h-11 items-center gap-3">
            <Checkbox
              name="conditionTags"
              value={tag}
              checked={tags.includes(tag)}
              onCheckedChange={(checked) =>
                setTags((prev) =>
                  checked === true
                    ? [...prev, tag]
                    : prev.filter((t) => t !== tag),
                )
              }
            />
            {CONDITION_LABELS[tag]}
          </label>
        ))}
      </fieldset>

      <details className="rounded-xl bg-muted px-4 py-3">
        <summary className="flex min-h-11 cursor-pointer items-center font-medium">
          처음에 켜질 미션 {starting.length}개
        </summary>
        <ul className="flex flex-col gap-1 pt-2 pb-1 text-sm">
          {starting.map((mission) => (
            <li key={mission.id} className="flex justify-between gap-3">
              <span>{mission.name}</span>
              <span className="shrink-0 text-muted-foreground">
                {mission.zoneName}
              </span>
            </li>
          ))}
        </ul>
        <p className="pt-2 text-sm text-muted-foreground">
          매일 이 중에서 몇 개만 골라 드려요. 나중에 미션 목록에서 켜고 끌 수
          있어요.
        </p>
      </details>

      <Button type="submit" size="lg" disabled={!household || pending}>
        다음
      </Button>
      {state?.error && (
        <p role="alert" className="text-center text-sm text-muted-foreground">
          {state.error}
        </p>
      )}
    </form>
  );
}
