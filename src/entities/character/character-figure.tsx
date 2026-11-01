import { cn } from "@/shared/lib/utils";

// 캐릭터 시트가 나오기 전까지 쓰는 임시 그림. 단순 도형으로 종류만 구분한다.
// 부위별 SVG·대기 움직임·반응 7종은 #29에서 이 자리를 바꾼다(ADR 0006).

type Props = {
  typeId: string;
  /** 접근성 이름. 장식이면 비워 둔다 */
  label?: string;
  className?: string;
};

export function CharacterFigure({ typeId, label, className }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "fill-card stroke-foreground/70 [stroke-linejoin:round] [stroke-width:3]",
        className,
      )}
    >
      {typeId === "dust-bunny" && <DustBunny />}
      {typeId === "cat" && <Cat />}
      {typeId === "hamster" && <Hamster />}
      {!["dust-bunny", "cat", "hamster"].includes(typeId) && (
        <circle cx="50" cy="58" r="30" />
      )}
    </svg>
  );
}

function Face({ y = 58, cheeks = false }: { y?: number; cheeks?: boolean }) {
  return (
    <>
      {cheeks && (
        <g className="fill-primary/30 stroke-none">
          <circle cx="32" cy={y + 8} r="7" />
          <circle cx="68" cy={y + 8} r="7" />
        </g>
      )}
      <g className="fill-foreground stroke-none">
        <circle cx="40" cy={y} r="3.5" />
        <circle cx="60" cy={y} r="3.5" />
      </g>
    </>
  );
}

function DustBunny() {
  return (
    <>
      <ellipse cx="38" cy="26" rx="8" ry="20" />
      <ellipse cx="62" cy="26" rx="8" ry="20" />
      <circle cx="50" cy="62" r="30" />
      <Face y={60} />
    </>
  );
}

function Cat() {
  return (
    <>
      <path d="M24 46 L28 16 L46 36 Z" />
      <path d="M76 46 L72 16 L54 36 Z" />
      <circle cx="50" cy="60" r="30" />
      <Face />
    </>
  );
}

function Hamster() {
  return (
    <>
      <circle cx="28" cy="34" r="9" />
      <circle cx="72" cy="34" r="9" />
      <ellipse cx="50" cy="62" rx="36" ry="28" />
      <Face y={58} cheeks />
    </>
  );
}
