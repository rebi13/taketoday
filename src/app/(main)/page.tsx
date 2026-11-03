import { Settings } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getTodayRecommendations } from "@/server/services";
import { Button } from "@/shared/ui/button";
import { TodayRecommendations } from "@/widgets/today-recommendations";

// S10 홈. 오늘의 추천과 적립 예정 n/10. 방(M4)이 들어올 자리다.
// 설정은 탭이 아니라 홈 상단에서 들어간다(screen-flow 세부 선택 ④).
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">오늘챙김</h1>
        <Button asChild variant="ghost" size="icon" aria-label="설정">
          <Link href="/settings">
            <Settings aria-hidden />
          </Link>
        </Button>
      </header>
      <div className="flex w-full max-w-2xl flex-col">
        <Suspense>
          <Today />
        </Suspense>
      </div>
    </main>
  );
}

async function Today() {
  const today = await getTodayRecommendations();
  if (!today) redirect("/login");
  // 날짜가 바뀌면(자정을 넘겨 다시 그리면) 낙관적 상태와 연출을 새로 시작한다
  return <TodayRecommendations key={today.date} today={today} />;
}
