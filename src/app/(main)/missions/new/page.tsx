import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MissionForm } from "@/features/save-mission";
import { getMissionEditor } from "@/server/services";
import { localDate } from "@/shared/lib/date";

// S13 미션 만들기. AI로 만들기(S14)를 고르는 단계는 M6에서 붙인다
export default function NewMissionPage() {
  return (
    // data-mission-detail: 좁은 화면에서 목록 대신 이 화면을 보이게 하는 표시(missions/layout)
    <div data-mission-detail>
      <Suspense>
        <Editor />
      </Suspense>
    </div>
  );
}

async function Editor() {
  const editor = await getMissionEditor();
  if (!editor) redirect("/login");
  return (
    <MissionForm zones={editor.zones} mission={null} today={localDate()} />
  );
}
