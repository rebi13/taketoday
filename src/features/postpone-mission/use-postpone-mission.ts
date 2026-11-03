"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { postponeMissionAction } from "./actions";

// 내일로 → T02 내일 다시 추천할게요. 재화나 기록에 불이익은 없다(기획서 6.3)
export function usePostponeMission(
  /** 트랜잭션 안에서 부른다(useOptimistic 갱신) */
  markPostponed: (missionId: string) => void,
) {
  const [pending, startTransition] = useTransition();

  const postpone = (missionId: string) =>
    startTransition(async () => {
      markPostponed(missionId);
      if (await postponeMissionAction(missionId)) {
        toast("내일 다시 추천할게요");
      } else {
        toast.error("미루지 못했어요. 잠시 뒤에 다시 해 주세요");
      }
    });

  return { postpone, pending };
}
