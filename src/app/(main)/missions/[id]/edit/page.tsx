import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MissionForm } from "@/features/save-mission";
import { getMissionEditor } from "@/server/services";
import { localDate } from "@/shared/lib/date";

// S13 미션 수정. 직접 만든 미션만. 기본 미션은 S12의 주기 바꾸기·내 기준으로 바꾸기로 고친다
export default function EditMissionPage({
  params,
}: PageProps<"/missions/[id]/edit">) {
  return (
    // data-mission-detail: 좁은 화면에서 목록 대신 이 화면을 보이게 하는 표시(missions/layout)
    <div data-mission-detail>
      <Suspense>
        <Editor params={params} />
      </Suspense>
    </div>
  );
}

async function Editor({
  params,
}: Pick<PageProps<"/missions/[id]/edit">, "params">) {
  const { id } = await params;
  const editor = await getMissionEditor({ missionId: id });
  if (!editor?.mission) notFound();
  return (
    <MissionForm
      // 다른 미션으로 옮겨 가면 입력값을 새로 시작한다
      key={editor.mission.id}
      zones={editor.zones}
      mission={editor.mission}
      today={localDate()}
    />
  );
}
