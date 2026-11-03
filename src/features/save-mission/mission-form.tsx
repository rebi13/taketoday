"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import {
  CheckCriteriaField,
  oneLineLength,
  ZoneIcon,
} from "@/entities/mission";
import {
  CHECK_CRITERIA_MAX_LENGTH,
  MISSION_CYCLE_MAX_DAYS,
  MISSION_CYCLE_MIN_DAYS,
  MISSION_DUE_MAX_DAYS,
  MISSION_NAME_MAX_LENGTH,
} from "@/shared/config/constants";
import { addDays } from "@/shared/lib/date";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { saveMissionAction, type SaveMissionState } from "./actions";
import { NO_ZONE } from "./no-zone";

// S13 미션 만들기·수정(기획서 6.4, screen-flow "미션 관리").
// 주기형(며칠마다)과 기한형(언제까지 한 번) 중 하나. 저장하면 T04를 띄우고
// 만들었으면 목록(S11), 고쳤으면 상세(S12)로 돌아간다
type Zone = { id: string; name: string; icon: string };

type Mission = {
  id: string;
  name: string;
  zoneId: string | null;
  kind: "recurring" | "once";
  cycleDays: number | null;
  dueDate: string | null;
  checkCriteria: string;
};

type Props = {
  zones: Zone[];
  /** 고칠 미션. 새로 만들 때는 null */
  mission: Mission | null;
  /** 서울 기준 오늘(마감일 고르는 범위) */
  today: string;
};

/** 새로 만들 때 기본 주기. 기본 미션에서 가장 흔한 "일주일마다" */
const DEFAULT_CYCLE_DAYS = 7;

export function MissionForm({ zones, mission, today }: Props) {
  const router = useRouter();
  const backHref = mission ? `/missions/${mission.id}` : "/missions";

  const [name, setName] = useState(mission?.name ?? "");
  const [zoneId, setZoneId] = useState(mission?.zoneId ?? NO_ZONE);
  const [kind, setKind] = useState(mission?.kind ?? "recurring");
  const [cycleDays, setCycleDays] = useState(
    String(mission?.cycleDays ?? DEFAULT_CYCLE_DAYS),
  );
  const [dueDate, setDueDate] = useState(mission?.dueDate ?? "");
  const [criteria, setCriteria] = useState(mission?.checkCriteria ?? "");

  const [state, formAction, pending] = useActionState(
    async (previous: SaveMissionState, formData: FormData) => {
      const next = await saveMissionAction(previous, formData);
      if (next?.status === "saved") {
        toast.success("저장했어요");
        router.push(next.href);
      }
      return next;
    },
    null,
  );

  const nameLength = oneLineLength(name);
  const criteriaLength = oneLineLength(criteria);
  const cycle = Number(cycleDays);
  const cycleValid =
    Number.isInteger(cycle) &&
    cycle >= MISSION_CYCLE_MIN_DAYS &&
    cycle <= MISSION_CYCLE_MAX_DAYS;
  const valid =
    nameLength > 0 &&
    nameLength <= MISSION_NAME_MAX_LENGTH &&
    criteriaLength > 0 &&
    criteriaLength <= CHECK_CRITERIA_MAX_LENGTH &&
    (kind === "recurring" ? cycleValid : dueDate !== "");
  // 고칠 때 이미 지난 마감은 그대로 둘 수 있다(서버 planMissionSchedule과 같은 규칙)
  const dueMin =
    mission?.dueDate && mission.dueDate < today ? mission.dueDate : today;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="-ml-2">
          <Button asChild variant="ghost">
            <Link href={backHref}>
              <ChevronLeft aria-hidden data-icon="inline-start" />
              {mission ? "상세로" : "내 미션"}
            </Link>
          </Button>
        </div>
        <h1 className="text-xl font-semibold">
          {mission ? "미션 수정" : "미션 만들기"}
        </h1>
      </header>

      {mission && <input type="hidden" name="missionId" value={mission.id} />}

      <div className="flex flex-col gap-2">
        <label htmlFor="mission-name" className="font-medium">
          이름
        </label>
        <Input
          id="mission-name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="예: 현관 신발 정리하기"
          aria-invalid={nameLength > MISSION_NAME_MAX_LENGTH || undefined}
          aria-describedby="mission-name-status"
        />
        <p
          id="mission-name-status"
          role="status"
          className="text-sm text-muted-foreground"
        >
          {nameLength}/{MISSION_NAME_MAX_LENGTH}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span id="mission-zone-label" className="font-medium">
          구역
        </span>
        <Select name="zoneId" value={zoneId} onValueChange={setZoneId}>
          <SelectTrigger
            aria-labelledby="mission-zone-label"
            className="w-full mid:w-64"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_ZONE}>구역 없음</SelectItem>
            {zones.map((zone) => (
              <SelectItem key={zone.id} value={zone.id}>
                <ZoneIcon icon={zone.icon} />
                {zone.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <span id="mission-kind-label" className="font-medium">
          언제 할까요
        </span>
        <input type="hidden" name="kind" value={kind} />
        <Tabs
          value={kind}
          onValueChange={(next) => setKind(next as Mission["kind"])}
          className="gap-3"
        >
          <TabsList
            aria-labelledby="mission-kind-label"
            className="w-full mid:w-fit"
          >
            <TabsTrigger value="recurring">며칠마다</TabsTrigger>
            <TabsTrigger value="once">언제까지 한 번</TabsTrigger>
          </TabsList>
          <TabsContent value="recurring" className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <Input
                name="cycleDays"
                type="number"
                inputMode="numeric"
                min={MISSION_CYCLE_MIN_DAYS}
                max={MISSION_CYCLE_MAX_DAYS}
                value={cycleDays}
                onChange={(event) => setCycleDays(event.target.value)}
                aria-invalid={!cycleValid || undefined}
                className="w-24"
              />
              일마다
            </label>
            <p className="text-sm text-muted-foreground">
              1이면 매일이에요. 놓쳐도 다음에 다시 추천해요.
            </p>
          </TabsContent>
          <TabsContent value="once" className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <Input
                name="dueDate"
                type="date"
                min={dueMin}
                max={addDays(today, MISSION_DUE_MAX_DAYS)}
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="w-44"
              />
              까지
            </label>
            <p className="text-sm text-muted-foreground">
              마감 3일 전부터 추천해요. 지나도 괜찮아요, 그때 다시 물어볼게요.
            </p>
          </TabsContent>
        </Tabs>
      </div>

      <CheckCriteriaField
        id="mission-criteria"
        name="checkCriteria"
        value={criteria}
        onChange={setCriteria}
      />

      <div className="flex flex-col gap-2">
        {state?.status === "error" && (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        )}
        <Button type="submit" disabled={!valid || pending}>
          저장
        </Button>
      </div>
    </form>
  );
}
