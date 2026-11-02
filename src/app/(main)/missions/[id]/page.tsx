import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getMissionDetail } from "@/server/services";
import { MissionDetail } from "@/widgets/mission-detail";

// S12 미션 상세. 없거나 남의 것이거나 지운 미션이면 404(S24는 #43)
export default function MissionDetailPage({
  params,
}: PageProps<"/missions/[id]">) {
  return (
    <Suspense>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: Pick<PageProps<"/missions/[id]">, "params">) {
  const { id } = await params;
  const mission = await getMissionDetail({ missionId: id });
  if (!mission) notFound();
  // 같은 레이아웃 안에서 다른 미션으로 옮겨 가면 시트·팝업 상태를 새로 시작한다
  return <MissionDetail key={mission.id} mission={mission} />;
}
