"use client";

import { useOptimistic, useTransition } from "react";
import { setMissionsActiveAction } from "./actions";

type Change = { ids: readonly string[]; active: boolean };

/**
 * 켜기·끄기의 화면 상태. 누르면 바로 바뀌어 보이고, 저장이 끝나면 서버 값으로 맞춘다.
 * 낱개 스위치와 구역의 "모두 켜기·끄기"가 같은 상태를 보도록 목록 전체를 쥔다
 */
export function useMissionToggle<T extends { id: string; active: boolean }>(
  missions: readonly T[],
) {
  const [optimistic, apply] = useOptimistic(
    missions,
    (state: readonly T[], change: Change) =>
      state.map((m) =>
        change.ids.includes(m.id) ? { ...m, active: change.active } : m,
      ),
  );
  const [, startTransition] = useTransition();

  const toggle = (ids: readonly string[], active: boolean) => {
    if (ids.length === 0) return;
    startTransition(async () => {
      apply({ ids, active });
      await setMissionsActiveAction([...ids], active);
    });
  };

  return { missions: optimistic, toggle };
}
