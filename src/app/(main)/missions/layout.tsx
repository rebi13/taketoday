import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getMissionBoard } from "@/server/services";
import { Button } from "@/shared/ui/button";
import { MissionBoard } from "@/widgets/mission-board";

// 미션 탭: S11 내 미션 목록 + S15 기본 미션 둘러보기(탭) | S12 미션 상세.
// 목록은 상세를 오가도 다시 그리지 않도록 레이아웃에 둔다. "+ 추가"는 S13 직접 만들기로 간다
// (AI로 만들기 S14를 고르는 단계는 M6)
export default function MissionsLayout({ children }: LayoutProps<"/missions">) {
  // 두 영역(구현 계획 "화면 기준"): 840 미만은 목록과 상세 중 하나만, 840 이상은 왼쪽 목록 · 오른쪽 상세.
  // 상세가 열렸는지는 상세 화면의 data-mission-detail 표시로 CSS(:has)가 알아챈다.
  // Next는 떠난 화면을 지우지 않고 <Activity hidden>으로 숨겨 두는데(style="display: none"),
  // 숨은 상세까지 열린 것으로 치지 않도록 style에 display가 붙은 것은 뺀다.
  // 주소를 읽는 훅을 쓰지 않아 정적 껍데기를 그대로 미리 그릴 수 있다.
  // 넓은 화면의 오른쪽 칸은 화면 높이 안에서 따로 스크롤한다(긴 만들기 화면도 끝까지 닿게)
  return (
    <main className="group/split flex flex-1 flex-col wide:grid wide:grid-cols-2 wide:items-start wide:gap-6 wide:px-4">
      <div className="flex flex-col gap-4 px-4 pt-4 pb-6 wide:px-0 max-wide:group-has-[[data-mission-detail]:not([style*=display])]/split:hidden">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">미션</h1>
          <Button asChild variant="outline">
            <Link href="/missions/new">
              <Plus aria-hidden data-icon="inline-start" />
              추가
            </Link>
          </Button>
        </div>
        <Suspense>
          <Board />
        </Suspense>
      </div>
      <div className="hidden flex-col px-4 pt-4 pb-6 has-[[data-mission-detail]:not([style*=display])]:flex wide:sticky wide:top-0 wide:flex wide:max-h-dvh wide:overflow-y-auto wide:px-0">
        {children}
      </div>
    </main>
  );
}

async function Board() {
  const board = await getMissionBoard();
  if (!board) redirect("/login");
  return <MissionBoard board={board} />;
}
