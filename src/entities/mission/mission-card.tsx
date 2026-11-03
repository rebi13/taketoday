import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

// 미션 카드(구현 계획 3.3 ②). status는 그날의 미션(daily_missions) 상태와 같은 이름을 쓴다.
// 내 미션 목록(S11)·기본 미션 둘러보기(S15)는 compact, 꺼 둔 미션은 active=false.
// status "none"은 날짜와 상관없이 미션 자체를 보여줄 때(S11·S15).
// 카드 전체를 덮어 누르게 하는 제목(링크·버튼). 동작 영역은 그 위에 놓는다
const COVER =
  "text-left outline-none after:absolute after:inset-0 after:rounded-xl";

const missionCard = cva(
  // href가 있으면 카드 전체가 링크다(제목의 ::after가 카드를 덮는다). 동작 영역은 그 위에 놓는다
  "relative flex items-center gap-3 rounded-xl border transition-colors duration-(--duration-fast) has-[a:focus-visible,h3>button:focus-visible]:ring-3 has-[a:focus-visible,h3>button:focus-visible]:ring-ring/50",
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
  /** 누르면 갈 곳(S12 미션 상세) */
  href?: string;
  /** 누르면 할 일(홈에서 P01 완료 기준 보기). href와 함께 쓰지 않는다 */
  onSelect?: () => void;
  /** 주기·마감처럼 이름 아래 한 줄 */
  meta?: ReactNode;
  /** 오른쪽 끝 동작(켜기 스위치, 더 보기 메뉴 등) */
  actions?: ReactNode;
  children?: ReactNode;
};

export function MissionCard({
  name,
  href,
  onSelect,
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
        <h3 className="font-medium text-foreground">
          {href ? (
            <Link href={href} className={COVER}>
              {name}
            </Link>
          ) : onSelect ? (
            <button type="button" onClick={onSelect} className={COVER}>
              {name}
            </button>
          ) : (
            name
          )}
        </h3>
        {meta && <p className="text-muted-foreground">{meta}</p>}
        {children}
      </div>
      {actions && (
        <div className="relative flex shrink-0 items-center">{actions}</div>
      )}
    </article>
  );
}
