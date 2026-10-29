import type { Metadata } from "next";

import { ComponentGallery } from "./_components/component-gallery";
import { ThemeSwitcher, WidthPreview } from "./_components/playground-controls";
import { TokenSwatches } from "./_components/token-swatches";

export const metadata: Metadata = { title: "디자인 시험장 · 오늘챙김" };

const PREVIEW_ID = "playground-preview";

export default function PlaygroundPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">디자인 시험장</h1>
        <p className="text-sm text-muted-foreground">
          토큰 값은 src/app/globals.css 한 곳에 있다. 값을 바꾸면 아래 견본과
          모든 컴포넌트에 바로 반영된다.
        </p>
        <ThemeSwitcher previewSelector={`#${PREVIEW_ID}`} />
      </header>

      <TokenSwatches />
      <ComponentGallery />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">화면 폭 미리보기</h2>
        <WidthPreview id={PREVIEW_ID} src="/playground/preview" />
      </section>
    </main>
  );
}
