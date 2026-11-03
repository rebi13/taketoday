import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import {
  CheckCriteriaBox,
  describeDate,
  describeSchedule,
  ZoneBadge,
} from "@/entities/mission";
import { EditCriteriaSheet } from "@/features/edit-check-criteria";
import { Button } from "@/shared/ui/button";
import {
  ChangeCycleButton,
  DeleteMissionButton,
  DoneTodayButton,
} from "./mission-detail-actions";
import type { MissionDetailData } from "./types";

// S12 미션 상세: 완료 기준 · 주기 · 마지막 수행일(screen-flow "미션 관리").
// 수정(S13)은 직접 만든 미션만. "오늘 했어요"로 추천 밖에서도 바로 완료한다
export function MissionDetail({ mission }: { mission: MissionDetailData }) {
  return (
    // data-mission-detail: 좁은 화면에서 목록 대신 상세를 보이게 하는 표시(missions/layout)
    <article data-mission-detail className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        {/* 넓은 화면에서는 목록이 왼쪽에 함께 보여 돌아가기가 필요 없다 */}
        <div className="-ml-2 wide:hidden">
          <Button asChild variant="ghost">
            <Link href="/missions">
              <ChevronLeft aria-hidden data-icon="inline-start" />내 미션
            </Link>
          </Button>
        </div>
        <ZoneBadge zone={mission.zone} />
        <h1 className="text-xl font-semibold">{mission.name}</h1>
        {!mission.active && (
          <p className="text-sm text-muted-foreground">
            꺼 둔 미션이에요. 켜면 다시 추천에 나와요.
          </p>
        )}
      </header>

      <CheckCriteriaBox
        checkCriteria={mission.checkCriteria}
        userModified={mission.userModified}
        action={
          <EditCriteriaSheet
            missionId={mission.id}
            checkCriteria={mission.checkCriteria}
            userModified={mission.userModified}
            templateCriteria={mission.templateCriteria}
          />
        }
      />

      {/* 추천에 없어도 오늘 한 일은 바로 남긴다. 적립 예정 n/10에 함께 잡힌다 */}
      <div>
        <DoneTodayButton mission={mission} />
      </div>

      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3">
        <dt className="text-sm text-muted-foreground">
          {mission.kind === "recurring" ? "주기" : "마감"}
        </dt>
        <dd className="flex flex-wrap items-center justify-between gap-2">
          {describeSchedule(mission)}
          <ChangeCycleButton mission={mission} />
        </dd>
        <dt className="text-sm text-muted-foreground">마지막으로 한 날</dt>
        <dd>
          {mission.lastDoneDate ? (
            describeDate(mission.lastDoneDate)
          ) : (
            <span className="text-muted-foreground">아직 기록이 없어요</span>
          )}
        </dd>
      </dl>

      <div className="flex flex-wrap gap-2">
        {!mission.fromTemplate && (
          <Button asChild variant="outline">
            <Link href={`/missions/${mission.id}/edit`}>수정</Link>
          </Button>
        )}
        <DeleteMissionButton mission={mission} />
      </div>
    </article>
  );
}
