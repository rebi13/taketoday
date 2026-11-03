"use client";

import { useActionState, useState, useTransition } from "react";
import { CHECK_CRITERIA_MAX_LENGTH } from "@/shared/config/constants";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { Textarea } from "@/shared/ui/textarea";
import {
  resetCriteriaAction,
  updateCriteriaAction,
  type EditCriteriaState,
} from "./actions";
import { criteriaHints, HINT_MESSAGES } from "./hints";

// P25 완료 기준 바꾸기(기획서 8.2.1). 고친 기준은 이 사용자의 미션에만 적용되고,
// 기본 미션 문장이 바뀌어도 덮어쓰지 않는다. 작성 규칙은 막지 않고 안내만 한다
type Props = {
  missionId: string;
  checkCriteria: string;
  userModified: boolean;
  /** 기본 미션의 지금 기준. 직접 만든 미션이면 null */
  templateCriteria: string | null;
};

export function EditCriteriaSheet(props: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline">
          내 기준으로 바꾸기
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-dvh overflow-y-auto">
        {/* 닫았다 열면 입력값과 오류를 처음 상태로 */}
        {open && <EditCriteriaForm {...props} onDone={() => setOpen(false)} />}
      </SheetContent>
    </Sheet>
  );
}

// 서버 normalizeCheckCriteria와 같은 정리: 줄바꿈·연속 공백은 공백 하나로
const tidy = (raw: string) => raw.replace(/\s+/g, " ").trim();

function EditCriteriaForm({
  missionId,
  checkCriteria,
  userModified,
  templateCriteria,
  onDone,
}: Props & { onDone: () => void }) {
  const [value, setValue] = useState(checkCriteria);
  const [state, formAction, pending] = useActionState(
    async (previous: EditCriteriaState, formData: FormData) => {
      const next = await updateCriteriaAction(previous, formData);
      if (next?.status === "saved") onDone();
      return next;
    },
    null,
  );
  const [resetting, startReset] = useTransition();
  const [resetError, setResetError] = useState<string | null>(null);

  const text = tidy(value);
  const length = [...text].length;
  const valid = length > 0 && length <= CHECK_CRITERIA_MAX_LENGTH;
  const hints = criteriaHints(text);
  const error =
    resetError ?? (state?.status === "error" ? state.message : null);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 pb-[calc(--spacing(4)+env(safe-area-inset-bottom))]">
      <SheetHeader className="px-0">
        <SheetTitle>내 기준으로 바꾸기</SheetTitle>
        <SheetDescription>
          내 생활에 맞게 고쳐도 괜찮아요. 고친 기준은 내 미션에만 적용돼요.
        </SheetDescription>
      </SheetHeader>

      <form action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="missionId" value={missionId} />
        <label htmlFor="check-criteria" className="font-medium">
          이만큼 하면 완료
        </label>
        <Textarea
          id="check-criteria"
          name="checkCriteria"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={3}
          aria-invalid={(!valid && length > 0) || undefined}
          aria-describedby="check-criteria-guide check-criteria-status"
        />
        <p id="check-criteria-guide" className="text-sm text-muted-foreground">
          [무엇으로] + [어디를] + [어떻게 끝내면] + “면 완료” 한 문장으로.
          가볍게 잡을수록 매일 하기 쉬워요.
        </p>
        {hints.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
            {hints.map((hint) => (
              <li key={hint}>{HINT_MESSAGES[hint]}</li>
            ))}
          </ul>
        )}
        <p
          id="check-criteria-status"
          role="status"
          className="text-sm text-muted-foreground"
        >
          {error ?? `${length}/${CHECK_CRITERIA_MAX_LENGTH}`}
        </p>
        <Button
          type="submit"
          disabled={!valid || text === checkCriteria || pending || resetting}
        >
          저장
        </Button>
      </form>

      {templateCriteria !== null && userModified && (
        <section className="flex flex-col gap-2 rounded-xl bg-muted px-4 py-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            기본 기준
          </h3>
          <p>{templateCriteria}</p>
          <Button
            type="button"
            variant="outline"
            disabled={pending || resetting}
            onClick={() =>
              startReset(async () => {
                setResetError(null);
                const next = await resetCriteriaAction(missionId);
                if (next?.status === "saved") onDone();
                else if (next?.status === "error") setResetError(next.message);
              })
            }
          >
            기본 기준으로 되돌리기
          </Button>
        </section>
      )}
    </div>
  );
}
