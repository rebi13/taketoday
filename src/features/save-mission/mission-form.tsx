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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  addCreatedToTodayAction,
  saveMissionAction,
  type SaveMissionState,
} from "./actions";
import { NO_ZONE } from "./no-zone";
import { useLeaveGuard } from "./use-leave-guard";

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
  /** 홈 "오늘 더 하기"에서 만들러 왔다: 저장하면 오늘 할 일에도 넣고 홈으로 */
  fromToday?: boolean;
};

/** 새로 만들 때 기본 주기. 기본 미션에서 가장 흔한 "일주일마다" */
const DEFAULT_CYCLE_DAYS = 7;

export function MissionForm({ zones, mission, today, fromToday }: Props) {
  const router = useRouter();
  const backHref = mission
    ? `/missions/${mission.id}`
    : fromToday
      ? "/"
      : "/missions";

  const initial = {
    name: mission?.name ?? "",
    zoneId: mission?.zoneId ?? NO_ZONE,
    kind: mission?.kind ?? "recurring",
    cycleDays: String(mission?.cycleDays ?? DEFAULT_CYCLE_DAYS),
    dueDate: mission?.dueDate ?? "",
    criteria: mission?.checkCriteria ?? "",
  };
  const [name, setName] = useState(initial.name);
  const [zoneId, setZoneId] = useState(initial.zoneId);
  const [kind, setKind] = useState(initial.kind);
  const [cycleDays, setCycleDays] = useState(initial.cycleDays);
  const [dueDate, setDueDate] = useState(initial.dueDate);
  const [criteria, setCriteria] = useState(initial.criteria);

  // Next는 떠난 화면을 숨겨 두었다가 돌아오면 그대로 보여 준다.
  // 저장했거나 버리고 나갔으면 다음에 열 때 처음 값으로 시작하도록 되돌린다
  const reset = () => {
    setName(initial.name);
    setZoneId(initial.zoneId);
    setKind(initial.kind);
    setCycleDays(initial.cycleDays);
    setDueDate(initial.dueDate);
    setCriteria(initial.criteria);
  };
  const dirty =
    name !== initial.name ||
    zoneId !== initial.zoneId ||
    kind !== initial.kind ||
    cycleDays !== initial.cycleDays ||
    dueDate !== initial.dueDate ||
    criteria !== initial.criteria;

  const [state, formAction, pending] = useActionState(
    async (previous: SaveMissionState, formData: FormData) => {
      const next = await saveMissionAction(previous, formData);
      if (next?.status === "saved") {
        reset();
        if (next.action === "created-today") {
          toast.success("만들어서 오늘 할 일에 넣었어요");
        } else if (next.action === "created") {
          // 만들자마자 오늘 하고 싶을 수 있어 T04에서 바로 넣을 수 있게 한다
          const { missionId } = next;
          toast.success("저장했어요", {
            action: {
              label: "오늘 할 일에 넣기",
              onClick: async () => {
                if (await addCreatedToTodayAction(missionId)) {
                  toast("오늘 할 일에 넣었어요. 홈에서 볼 수 있어요");
                } else {
                  toast.error("넣지 못했어요. 잠시 뒤에 다시 해 주세요");
                }
              },
            },
          });
        } else {
          toast.success("저장했어요");
        }
        router.push(next.href);
      }
      return next;
    },
    null,
  );
  const leave = useLeaveGuard(dirty && !pending);

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
              {mission ? "상세로" : fromToday ? "홈으로" : "내 미션"}
            </Link>
          </Button>
        </div>
        <h1 className="text-xl font-semibold">
          {mission ? "미션 수정" : "미션 만들기"}
        </h1>
        {fromToday && (
          <p className="text-sm text-muted-foreground">
            저장하면 내 미션에 들어가고, 오늘 할 일에도 바로 넣어요.
          </p>
        )}
      </header>

      {mission && <input type="hidden" name="missionId" value={mission.id} />}
      {fromToday && <input type="hidden" name="fromToday" value="1" />}

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

      {/* 저장 버튼은 화면 아래에 붙여 둔다(좁은 화면은 하단 탭바 위, 넓은 화면은 오른쪽 칸 아래).
          긴 입력 화면에서 끝까지 스크롤하지 않아도 저장할 수 있게 */}
      <div className="sticky bottom-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))] -mx-4 flex flex-col gap-2 border-t bg-background px-4 py-3 wide:bottom-0 wide:mx-0 wide:px-0">
        {state?.status === "error" && (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        )}
        <Button type="submit" disabled={!valid || pending}>
          저장
        </Button>
      </div>

      <Dialog
        open={leave.pendingHref !== null}
        onOpenChange={(open) => !open && leave.stay()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>적던 내용이 있어요</DialogTitle>
            <DialogDescription>
              지금 나가면 적은 내용은 저장되지 않아요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                계속 쓰기
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={() => {
                const href = leave.pendingHref;
                leave.stay();
                reset();
                if (href) router.push(href);
              }}
            >
              나가기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
