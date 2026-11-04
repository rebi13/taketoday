"use client";

import { useState } from "react";
import { acknowledgeRewardsAction } from "./actions";
import {
  RewardArrivalDialog,
  type RewardArrivalData,
} from "./reward-arrival-dialog";

/**
 * 홈을 열었을 때 아직 안 본 정산 보상이 있으면 P09를 한 번 띄운다.
 * 닫으면 본 것으로 표시해 다음에 다시 띄우지 않는다
 */
export function RewardArrival({
  arrival,
}: {
  arrival: (RewardArrivalData & { settlementIds: string[] }) | null;
}) {
  const [open, setOpen] = useState(arrival !== null);
  if (!arrival) return null;
  return (
    <RewardArrivalDialog
      arrival={arrival}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) void acknowledgeRewardsAction(arrival.settlementIds);
      }}
    />
  );
}
