import { Coins } from "lucide-react";

// 재화 잔액(S10 홈 상단). 정산을 마친 값이라 오늘 완료한 것은 아직 들어 있지 않다(ADR 0003)
export function WalletBalance({ balance }: { balance: number }) {
  return (
    <p
      aria-label={`가진 재화 ${balance}`}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-muted px-3 font-semibold tabular-nums"
    >
      <Coins aria-hidden className="size-4 text-primary" />
      {balance.toLocaleString("ko-KR")}
    </p>
  );
}
