import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getMissionBoard } from "@/server/services";
import { MissionBoard } from "@/widgets/mission-board";

// 미션 탭: S11 내 미션 목록 + S15 기본 미션 둘러보기(탭) | S12 미션 상세.
// 목록은 상세를 오가도 다시 그리지 않도록 레이아웃에 둔다. 직접 만들기(S13)는 #17
export default function MissionsLayout({ children }: LayoutProps<"/missions">) {
  // 두 영역(구현 계획 "화면 기준"): 840 미만은 목록과 상세 중 하나만, 840 이상은 왼쪽 목록 · 오른쪽 상세.
  // 상세가 열렸는지는 상세 화면의 data-mission-detail 표시로 CSS(:has)가 알아챈다.
  // 주소를 읽는 훅을 쓰지 않아 정적 껍데기를 그대로 미리 그릴 수 있다
  return (
    <main className="group/split flex flex-1 flex-col wide:grid wide:grid-cols-2 wide:items-start wide:gap-6 wide:px-4">
      <div className="flex flex-col gap-4 px-4 pt-4 pb-6 wide:px-0 max-wide:group-has-[[data-mission-detail]]/split:hidden">
        <h1 className="text-xl font-semibold">미션</h1>
        <Suspense>
          <Board />
        </Suspense>
      </div>
      <div className="hidden flex-col px-4 pt-4 pb-6 has-[[data-mission-detail]]:flex wide:sticky wide:top-0 wide:flex wide:px-0">
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
