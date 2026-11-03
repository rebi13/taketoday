"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { cancelCompletionAction } from "./actions";

// 완료 취소(기획서 6.5). 홈은 T01의 되돌리기로 바로, 기록 화면은 P04 확인 뒤(#22).
// 취소는 완료한 날 안에서만. 취소한 미션은 같은 날 "다시 완료"할 수 있다
export function useCancelCompletion(
  /** 트랜잭션 안에서 부른다(useOptimistic 갱신) */
  markCanceled: (missionId: string) => void,
) {
  const [pending, startTransition] = useTransition();

  const cancel = (missionId: string, date: string) =>
    startTransition(async () => {
      markCanceled(missionId);
      const result = await cancelCompletionAction(missionId, date);
      if (result.ok) {
        toast("완료를 취소했어요", {
          description: "오늘 안에는 다시 완료할 수 있어요",
        });
      } else if (result.reason === "past-day") {
        toast("자정이 지나 그날 기록은 확정됐어요");
      } else {
        toast.error("취소하지 못했어요. 잠시 뒤에 다시 해 주세요");
      }
    });

  return { cancel, pending };
}
