import { Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";

// S10 홈. 오늘의 추천(M2)과 방(M4)이 들어올 자리다.
// 설정은 탭이 아니라 홈 상단에서 들어간다(screen-flow 세부 선택 ④).
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-xl font-semibold">오늘챙김</h1>
        <Button asChild variant="ghost" size="icon" aria-label="설정">
          <Link href="/settings">
            <Settings aria-hidden />
          </Link>
        </Button>
      </header>
      <p className="px-4 pt-2 text-muted-foreground">
        오늘의 추천이 곧 여기에 나와요
      </p>
    </main>
  );
}
