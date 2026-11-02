"use client";

import { useTransition } from "react";
import { Button } from "@/shared/ui/button";
import { turnOnTemplateAction } from "./actions";

// S15 기본 미션 켜기. 켜면 내 미션 목록으로 옮겨 가고 이 목록에서는 빠진다
export function TurnOnTemplateButton({
  templateId,
  name,
}: {
  templateId: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      aria-label={`${name} 켜기`}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await turnOnTemplateAction(templateId);
        })
      }
    >
      켜기
    </Button>
  );
}
