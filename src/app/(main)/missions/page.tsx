import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getMissionBoard } from "@/server/services";
import { MissionBoard } from "@/widgets/mission-board";

// S11 내 미션 목록 + S15 기본 미션 둘러보기(탭). 상세(S12)는 #16, 직접 만들기(S13)는 #17
export default function MissionsPage({ searchParams }: PageProps<"/missions">) {
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-6">
      <h1 className="text-xl font-semibold">미션</h1>
      <Suspense>
        <Board searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Board({
  searchParams,
}: Pick<PageProps<"/missions">, "searchParams">) {
  const [board, { tab }] = await Promise.all([getMissionBoard(), searchParams]);
  if (!board) redirect("/login");
  return (
    <MissionBoard
      board={board}
      initialTab={tab === "browse" ? "browse" : "mine"}
    />
  );
}
