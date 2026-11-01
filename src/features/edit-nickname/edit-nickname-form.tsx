"use client";

import { useActionState, useState } from "react";
import {
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
} from "@/shared/config/constants";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { editNicknameAction, type EditNicknameState } from "./actions";

// S20 설정의 닉네임 바꾸기. 처음 닉네임은 약관 동의 때 랜덤으로 받는다(#57).
// 서버(normalizeName)와 같은 정리: 앞뒤 공백 제거, 가운데 연속 공백은 하나로
const tidy = (raw: string) => raw.trim().replace(/ {2,}/g, " ");

export function EditNicknameForm({ nickname }: { nickname: string | null }) {
  const [value, setValue] = useState(nickname ?? "");
  // 저장에 성공하면 입력칸을 서버가 정리해 저장한 값으로 바꾼다
  const [state, formAction, pending] = useActionState(
    async (previous: EditNicknameState, formData: FormData) => {
      const next = await editNicknameAction(previous, formData);
      if (next?.status === "saved") setValue(next.nickname);
      return next;
    },
    null,
  );
  const saved = state?.status === "saved" ? state.nickname : nickname;
  // DB의 char_length와 같은 기준(코드 포인트)으로 센다
  const length = [...tidy(value)].length;
  const valid = length >= NICKNAME_MIN_LENGTH && length <= NICKNAME_MAX_LENGTH;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label htmlFor="nickname" className="font-medium">
        닉네임
      </label>
      <div className="flex gap-2">
        <Input
          id="nickname"
          name="nickname"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoComplete="nickname"
          aria-describedby="nickname-status"
          aria-invalid={(!valid && length > 0) || undefined}
        />
        <Button
          type="submit"
          variant="outline"
          disabled={!valid || tidy(value) === saved || pending}
        >
          저장
        </Button>
      </div>
      <p
        id="nickname-status"
        role="status"
        className="text-sm text-muted-foreground"
      >
        {state?.status === "error"
          ? state.message
          : state?.status === "saved" && tidy(value) === saved
            ? "저장했어요"
            : `${length}/${NICKNAME_MAX_LENGTH}`}
      </p>
    </form>
  );
}
