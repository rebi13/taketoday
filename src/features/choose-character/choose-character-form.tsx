"use client";

import { useActionState, useState } from "react";
import { CharacterFigure } from "@/entities/character";
import { CHARACTER_NAME_MAX_LENGTH } from "@/shared/config/constants";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { chooseCharacterAction } from "./actions";

// S04 캐릭터 고르기·이름 짓기. 고르면 이름 칸에 종류 이름을 넣어 주고,
// 사용자가 직접 고친 뒤에는 바꾸지 않는다.
type Props = {
  types: { id: string; name: string }[];
};

export function ChooseCharacterForm({ types }: Props) {
  const [typeId, setTypeId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameEdited, setNameEdited] = useState(false);
  const [state, formAction, pending] = useActionState(
    chooseCharacterAction,
    null,
  );
  // DB의 char_length와 같은 기준(코드 포인트)으로 센다
  const length = [...name.trim()].length;

  const choose = (id: string, typeName: string) => {
    setTypeId(id);
    if (!nameEdited) setName(typeName);
  };

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 font-medium">함께할 친구</legend>
        <div className="grid grid-cols-3 gap-3">
          {types.map((type) => (
            <label
              key={type.id}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl bg-card p-3 ring-1 ring-foreground/10 transition-shadow duration-(--duration-fast) has-checked:ring-2 has-checked:ring-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
            >
              <input
                type="radio"
                name="characterTypeId"
                value={type.id}
                checked={typeId === type.id}
                onChange={() => choose(type.id, type.name)}
                className="sr-only"
              />
              <CharacterFigure typeId={type.id} className="size-20" />
              <span className="text-sm font-medium">{type.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="character-name" className="font-medium">
          이름
        </label>
        <Input
          id="character-name"
          name="name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setNameEdited(true);
          }}
          autoComplete="off"
          aria-describedby="character-name-hint"
          aria-invalid={length > CHARACTER_NAME_MAX_LENGTH || undefined}
        />
        <p
          id="character-name-hint"
          className="text-right text-sm text-muted-foreground"
        >
          {length}/{CHARACTER_NAME_MAX_LENGTH}
        </p>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={
          !typeId ||
          length === 0 ||
          length > CHARACTER_NAME_MAX_LENGTH ||
          pending
        }
      >
        이 친구와 시작하기
      </Button>
      {state?.error && (
        <p role="alert" className="text-center text-sm text-muted-foreground">
          {state.error}
        </p>
      )}
    </form>
  );
}
