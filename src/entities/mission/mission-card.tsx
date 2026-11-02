import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

// 미션 카드(구현 계획 3.3 ②). status는 그날의 미션(daily_missions) 상태와 같은 이름을 쓴다.
// 내 미션 목록(S11)·기본 미션 둘러보기(S15)는 compact, 꺼 둔 미션은 active=false.
// status "none"은 날짜와 상관없이 미션 자체를 보여줄 때(S11·S15).
const missionCard = cva(
  "flex items-center gap-3 rounded-xl border transition-colors duration-(--duration-fast)",
  {
    // 뒤에 오는 변형이 앞의 같은 속성을 덮는다(cn = tailwind-merge). 상태가 켜기·끄기보다 우선
    variants: {
      active: {
        true: "bg-card text-card-foreground",
        false: "bg-muted text-muted-foreground",
      },
      status: {
        none: "border-border",
        pending: "border-border",
        done: "border-transparent bg-muted opacity-80",
        postponed: "border-dashed border-postponed",
        canceled: "border-border line-through opacity-60",
      },
      size: {
        default: "p-4",
        compact: "p-3 text-sm",
      },
    },
    defaultVariants: { status: "none", size: "default", active: true },
  },
);

type Props = VariantProps<typeof missionCard> & {
  name: string;
  /** 주기·마감처럼 이름 아래 한 줄 */
  meta?: ReactNode;
  /** 오른쪽 끝 동작(켜기 스위치, 더 보기 메뉴 등) */
  actions?: ReactNode;
  children?: ReactNode;
};

export function MissionCard({
  name,
  meta,
  actions,
  children,
  status,
  size,
  active,
}: Props) {
  return (
    <article className={cn(missionCard({ active, status, size }))}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="font-medium text-foreground">{name}</h3>
        {meta && <p className="text-muted-foreground">{meta}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 items-center">{actions}</div>}
    </article>
  );
}
