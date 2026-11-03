"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MISSION_REWARD } from "@/shared/config/constants";
import { completeMissionAction } from "./actions";
import { DailyCapDialog, FirstCompletionDialog } from "./reward-dialogs";

// 완료 버튼의 흐름(screen-flow "하루 흐름"): 낙관적으로 완료 표시 → 서버 완료 →
// T01 완료했어요·되돌리기 / 이미 적립 예정이면 T03 → 처음이면 P08, 10번째면 P03.
// 낙관적 상태는 목록을 쥔 쪽(위젯)이 갖고, 여기서는 그 갱신 함수를 받아 부른다.
// 되돌리기(완료 취소)는 cancel-completion 기능이 하므로 쓰는 쪽이 이어 준다
type Notice = "first" | "cap";

export function useCompleteMission({
  date,
  markDone,
  onUndo,
}: {
  /** 화면이 보는 날(서울 기준). 자정을 넘긴 화면에서 누르면 서버가 거부한다 */
  date: string;
  /** 트랜잭션 안에서 부른다(useOptimistic 갱신) */
  markDone: (missionId: string) => void;
  /** T01 되돌리기 */
  onUndo: (missionId: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [notices, setNotices] = useState<Notice[]>([]);

  const complete = (missionId: string) =>
    startTransition(async () => {
      markDone(missionId);
      const result = await completeMissionAction(missionId, date);
      if (!result.ok) {
        if (result.reason === "already") {
          toast("이미 보상을 받을 미션이에요");
        } else if (result.reason === "past-day") {
          toast("날짜가 바뀌어 오늘의 추천을 새로 불러왔어요");
        } else {
          toast.error("완료하지 못했어요. 잠시 뒤에 다시 해 주세요");
        }
        return;
      }
      toast.success("완료했어요", {
        description: result.counted
          ? `적립 예정 +${MISSION_REWARD}`
          : "오늘 보상은 다 모았어요. 기록에는 남아요",
        action: { label: "되돌리기", onClick: () => onUndo(missionId) },
      });
      const next: Notice[] = [];
      if (result.firstEver) next.push("first");
      if (result.reachedCap) next.push("cap");
      if (next.length > 0) setNotices(next);
    });

  // 팝업은 한 번에 하나씩: P08을 닫으면 P03
  const close = () => setNotices((list) => list.slice(1));
  const dialogs = (
    <>
      <FirstCompletionDialog
        open={notices[0] === "first"}
        onOpenChange={(open) => !open && close()}
      />
      <DailyCapDialog
        open={notices[0] === "cap"}
        onOpenChange={(open) => !open && close()}
      />
    </>
  );

  return { complete, pending, dialogs };
}
