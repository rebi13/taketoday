import {
  DAILY_PERSONAL_REWARD_CAP,
  MISSION_REWARD,
} from "@/shared/config/constants";
import { cn } from "@/shared/lib/utils";

// 오늘 적립 예정 n/10(S10). 보상은 다음 날 정산되므로 "예정"이라 부른다(ADR 0003).
// 칸 10개 중 채운 만큼 색칠한다
export function PendingRewardMeter({ count }: { count: number }) {
  const filled = Math.min(count, DAILY_PERSONAL_REWARD_CAP);
  return (
    <section
      aria-label="오늘 적립 예정"
      className="flex flex-col gap-2 rounded-xl bg-muted px-4 py-3"
    >
      <p className="flex items-baseline justify-between gap-2">
        <span className="font-medium">오늘 적립 예정</span>
        <span className="text-sm text-muted-foreground">
          <span className="text-base font-semibold text-foreground">
            {filled}
          </span>
          /{DAILY_PERSONAL_REWARD_CAP} · 내일 {filled * MISSION_REWARD} 도착
        </span>
      </p>
      <div aria-hidden className="flex gap-1">
        {Array.from({ length: DAILY_PERSONAL_REWARD_CAP }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors duration-(--duration-reward)",
              i < filled ? "bg-primary" : "bg-background",
            )}
          />
        ))}
      </div>
    </section>
  );
}
