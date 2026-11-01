"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { agreeTermsAction } from "./actions";

// S02 약관 동의. 세 항목 모두 필수이고, 모두 체크해야 버튼이 켜진다.
// 만 14세 미만은 가입을 받지 않으므로 생년월일 대신 체크 하나로 확인한다(기획서 17.1).
const ITEMS = [
  { name: "terms", label: "이용약관에 동의해요", href: "/terms#terms" },
  {
    name: "privacy",
    label: "개인정보 수집·이용에 동의해요",
    href: "/terms#privacy",
  },
  { name: "over14", label: "만 14세 이상이에요", href: null },
] as const;

type ItemName = (typeof ITEMS)[number]["name"];

export function TermsAgreementForm() {
  const [checked, setChecked] = useState<Record<ItemName, boolean>>({
    terms: false,
    privacy: false,
    over14: false,
  });
  const [state, formAction, pending] = useActionState(agreeTermsAction, null);
  const allChecked = ITEMS.every(({ name }) => checked[name]);

  const setAll = (value: boolean) =>
    setChecked({ terms: value, privacy: value, over14: value });

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <label className="flex min-h-11 items-center gap-3 rounded-lg bg-muted px-4 font-medium">
        <Checkbox
          checked={allChecked}
          onCheckedChange={(value) => setAll(value === true)}
        />
        모두 동의해요
      </label>

      <ul className="flex flex-col gap-1 px-1">
        {ITEMS.map(({ name, label, href }) => (
          <li key={name} className="flex min-h-11 items-center gap-3">
            <label className="flex flex-1 items-center gap-3">
              <Checkbox
                name={name}
                checked={checked[name]}
                onCheckedChange={(value) =>
                  setChecked((prev) => ({ ...prev, [name]: value === true }))
                }
              />
              <span>
                <span className="text-primary">(필수)</span> {label}
              </span>
            </label>
            {href && (
              <Button asChild variant="link" size="sm">
                <Link href={href} target="_blank">
                  보기
                </Link>
              </Button>
            )}
          </li>
        ))}
      </ul>

      <p className="text-sm text-muted-foreground">
        오늘챙김은 만 14세 이상만 가입할 수 있어요.
      </p>

      <Button type="submit" size="lg" disabled={!allChecked || pending}>
        동의하고 시작하기
      </Button>
      {state?.error && (
        <p role="alert" className="text-center text-sm text-muted-foreground">
          {state.error}
        </p>
      )}
    </form>
  );
}
