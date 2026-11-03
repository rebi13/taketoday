"use client";

import { CHECK_CRITERIA_MAX_LENGTH } from "@/shared/config/constants";
import { Textarea } from "@/shared/ui/textarea";
import { criteriaHints, HINT_MESSAGES } from "./criteria-hints";

// 완료 기준 입력칸(P25 내 기준으로 바꾸기, S13 미션 만들기·수정).
// 작성 규칙(기획서 8.2)은 막지 않고 안내만 한다. 값은 쓰는 쪽이 쥔다

/** 서버 normalizeOneLine과 같은 정리: 줄바꿈·연속 공백은 공백 하나로 */
export function tidyOneLine(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

/** 서버(DB char_length)와 같은 기준으로 센 길이 */
export function oneLineLength(raw: string): number {
  return [...tidyOneLine(raw)].length;
}

type Props = {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  /** 서버가 돌려준 오류. 있으면 글자 수 대신 보인다 */
  error?: string | null;
};

export function CheckCriteriaField({
  id,
  name,
  value,
  onChange,
  error,
}: Props) {
  const length = oneLineLength(value);
  const tooLong = length > CHECK_CRITERIA_MAX_LENGTH;
  const hints = criteriaHints(tidyOneLine(value));
  const guideId = `${id}-guide`;
  const statusId = `${id}-status`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-medium">
        이만큼 하면 완료
      </label>
      <Textarea
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        aria-invalid={tooLong || Boolean(error) || undefined}
        aria-describedby={`${guideId} ${statusId}`}
      />
      <p id={guideId} className="text-sm text-muted-foreground">
        [무엇으로] + [어디를] + [어떻게 끝내면] + “면 완료” 한 문장으로. 가볍게
        잡을수록 매일 하기 쉬워요.
      </p>
      {hints.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          {hints.map((hint) => (
            <li key={hint}>{HINT_MESSAGES[hint]}</li>
          ))}
        </ul>
      )}
      <p id={statusId} role="status" className="text-sm text-muted-foreground">
        {error ?? `${length}/${CHECK_CRITERIA_MAX_LENGTH}`}
      </p>
    </div>
  );
}
