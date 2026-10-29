import { ComponentGallery } from "../_components/component-gallery";

// /playground의 화면 폭 미리보기 iframe이 여는 페이지
export default function PlaygroundPreviewPage() {
  return (
    <main className="flex flex-col gap-8 px-4 py-6">
      <ComponentGallery />
    </main>
  );
}
