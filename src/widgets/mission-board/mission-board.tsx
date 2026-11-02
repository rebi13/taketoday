"use client";

import { ListPlus } from "lucide-react";
import { useState } from "react";
import {
  describeCycle,
  describeSchedule,
  MissionCard,
  ZoneBadge,
} from "@/entities/mission";
import {
  MissionActiveSwitch,
  useMissionToggle,
  ZoneToggleButton,
} from "@/features/toggle-mission";
import { TurnOnTemplateButton } from "@/features/turn-on-template";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { groupByZone, type ZoneGroup } from "./group-by-zone";
import { MissionMenu } from "./mission-menu";
import type { BoardTab, MissionBoardData } from "./types";

// S11 내 미션 목록과 S15 기본 미션 둘러보기(S11 안의 탭, screen-flow ⑤).
// 탭은 주소의 ?tab=browse와 맞춰 둔다(새로 고쳐도 같은 탭).
export function MissionBoard({
  board,
  initialTab,
}: {
  board: MissionBoardData;
  initialTab: BoardTab;
}) {
  const [tab, setTab] = useState<BoardTab>(initialTab);
  const changeTab = (next: string) => {
    const value: BoardTab = next === "browse" ? "browse" : "mine";
    setTab(value);
    const url = new URL(window.location.href);
    if (value === "browse") url.searchParams.set("tab", "browse");
    else url.searchParams.delete("tab");
    window.history.replaceState(null, "", url);
  };

  // 낱개 스위치와 구역의 모두 켜기·끄기가 같은 상태를 본다
  const { missions: myMissions, toggle } = useMissionToggle(board.mine);
  const mine = groupByZone(board.zones, myMissions);
  const browse = groupByZone(board.zones, board.browse);
  const activeCount = myMissions.filter((m) => m.active).length;

  return (
    <Tabs value={tab} onValueChange={changeTab} className="gap-4">
      <TabsList className="w-full mid:w-fit">
        <TabsTrigger value="mine">내 미션 {board.mine.length}</TabsTrigger>
        <TabsTrigger value="browse">기본 미션 더 보기</TabsTrigger>
      </TabsList>

      <TabsContent value="mine" className="flex flex-col gap-6">
        {activeCount === 0 && (
          <NoActiveMissions onBrowse={() => changeTab("browse")} />
        )}
        <ZoneGroups
          groups={mine}
          headerAction={(group) => (
            <ZoneToggleButton
              zoneName={group.zone?.name ?? "구역 없음"}
              allActive={group.items.every((m) => m.active)}
              onToggle={(active) =>
                toggle(
                  group.items
                    .filter((m) => m.active !== active)
                    .map((m) => m.id),
                  active,
                )
              }
            />
          )}
          render={(mission) => (
            <MissionCard
              size="compact"
              active={mission.active}
              name={mission.name}
              meta={mission.active ? describeSchedule(mission) : "꺼 둠"}
              actions={
                <>
                  <MissionActiveSwitch
                    name={mission.name}
                    active={mission.active}
                    onToggle={(active) => toggle([mission.id], active)}
                  />
                  <MissionMenu mission={mission} />
                </>
              }
            />
          )}
        />
      </TabsContent>

      <TabsContent value="browse" className="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          켜면 내 미션에 들어가고, 매일 추천할 때 함께 골라요.
        </p>
        {browse.length === 0 ? (
          <p className="rounded-xl bg-muted px-4 py-6 text-center text-muted-foreground">
            기본 미션을 모두 켰어요.
          </p>
        ) : (
          <ZoneGroups
            groups={browse}
            render={(template) => (
              <MissionCard
                size="compact"
                name={template.name}
                meta={describeCycle(template.cycleDays)}
                actions={
                  <TurnOnTemplateButton
                    templateId={template.id}
                    name={template.name}
                  />
                }
              >
                <p className="text-muted-foreground">
                  이만큼 하면 완료: {template.checkCriteria}
                </p>
              </MissionCard>
            )}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}

function ZoneGroups<T extends { id: string; zoneId: string | null }>({
  groups,
  render,
  headerAction,
}: {
  groups: ZoneGroup<T>[];
  render: (item: T) => React.ReactNode;
  /** 구역 이름표 오른쪽(내 미션 탭의 모두 켜기·끄기) */
  headerAction?: (group: ZoneGroup<T>) => React.ReactNode;
}) {
  return groups.map((group) => (
    <section
      key={group.zone?.id ?? "none"}
      aria-label={group.zone?.name ?? "구역 없음"}
      className="flex flex-col gap-2"
    >
      <div className="flex min-h-11 items-center justify-between gap-2">
        <h2>
          <ZoneBadge zone={group.zone} />
        </h2>
        {headerAction?.(group)}
      </div>
      <ul className="grid gap-2 mid:grid-cols-2">
        {group.items.map((item) => (
          <li key={item.id}>{render(item)}</li>
        ))}
      </ul>
    </section>
  ));
}

/** E02 켜진 미션 없음 → S15 */
function NoActiveMissions({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-muted px-4 py-8 text-center">
      <p className="font-medium">켜 둔 미션이 없어요</p>
      <p className="text-sm text-muted-foreground">
        기본 미션 중에서 해 볼 만한 것을 하나 켜 볼까요?
      </p>
      <Button type="button" onClick={onBrowse}>
        <ListPlus aria-hidden data-icon="inline-start" />
        기본 미션 둘러보기
      </Button>
    </div>
  );
}
