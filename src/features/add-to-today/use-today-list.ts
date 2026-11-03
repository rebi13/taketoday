"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { addToTodayAction, removeFromTodayAction } from "./actions";

// 오늘 더 하기(기획서 6.2): 추천 외에도 원하는 만큼 할 수 있다. 보상은 하루 상한까지.
// 낙관적 상태는 목록을 쥔 쪽(위젯)이 갖고, 여기서는 그 갱신 함수를 받아 부른다
export function useTodayList({
  markAdded,
  markRemoved,
}: {
  /** 트랜잭션 안에서 부른다(useOptimistic 갱신) */
  markAdded: (missionId: string) => void;
  markRemoved: (missionId: string) => void;
}) {
  const [pending, startTransition] = useTransition();

  const add = (missionId: string, name: string) =>
    startTransition(async () => {
      markAdded(missionId);
      if (await addToTodayAction(missionId)) {
        toast(`‘${name}’ 미션을 오늘 할 일에 넣었어요`);
      } else {
        toast.error("넣지 못했어요. 잠시 뒤에 다시 해 주세요");
      }
    });

  const remove = (missionId: string) =>
    startTransition(async () => {
      markRemoved(missionId);
      if (!(await removeFromTodayAction(missionId))) {
        toast.error("빼지 못했어요. 잠시 뒤에 다시 해 주세요");
      }
    });

  return { add, remove, pending };
}
