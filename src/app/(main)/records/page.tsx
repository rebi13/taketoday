import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getRecords } from "@/server/services";
import { RecordsView } from "@/widgets/records";

// S16 기록과 S17 날짜별 상세(펼치기). 최근 기록 있는 30일까지 보여 준다
export default function RecordsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-6">
      <h1 className="text-xl font-semibold">기록</h1>
      <div className="flex w-full max-w-2xl flex-col">
        <Suspense>
          <Records />
        </Suspense>
      </div>
    </main>
  );
}

async function Records() {
  const records = await getRecords();
  if (!records) redirect("/login");
  // 날짜가 바뀌면 낙관적 상태를 새로 시작한다
  return <RecordsView key={records.today} records={records} />;
}
