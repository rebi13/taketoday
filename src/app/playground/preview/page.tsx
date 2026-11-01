import { TabNav } from "@/widgets/tab-nav";
import { ComponentGallery } from "../_components/component-gallery";

// /playground의 화면 폭 미리보기 iframe이 여는 페이지.
// (main) 레이아웃과 같은 틀로 감싸 폭에 따라 하단 탭바 ↔ 왼쪽 세로 메뉴가 바뀌는지 본다.
export default function PlaygroundPreviewPage() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col wide:flex-row">
      <TabNav />
      <main className="flex flex-1 flex-col gap-8 px-4 py-6 pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))] wide:pb-6">
        <ComponentGallery />
      </main>
    </div>
  );
}
