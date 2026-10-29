"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/shared/ui/button";

import { PREVIEW_WIDTHS, THEMES, type ThemeId } from "./tokens";

// 테마는 실제 앱과 같이 <html data-theme>만 바꾼다. 같은 출처 iframe의 html에도 똑같이 적용한다.
function applyTheme(doc: Document | null | undefined, theme: ThemeId) {
  if (!doc) return;
  if (theme === "default") delete doc.documentElement.dataset.theme;
  else doc.documentElement.dataset.theme = theme;
}

export function ThemeSwitcher({
  previewSelector,
}: {
  previewSelector: string;
}) {
  const [theme, setTheme] = useState<ThemeId>("default");

  useEffect(() => {
    applyTheme(document, theme);
    const frame = document.querySelector<HTMLIFrameElement>(previewSelector);
    applyTheme(frame?.contentDocument, theme);
    const onLoad = () => applyTheme(frame?.contentDocument, theme);
    frame?.addEventListener("load", onLoad);
    return () => frame?.removeEventListener("load", onLoad);
  }, [theme, previewSelector]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">테마</span>
      {THEMES.map(({ id, label }) => (
        <Button
          key={id}
          size="sm"
          variant={theme === id ? "default" : "outline"}
          aria-pressed={theme === id}
          onClick={() => setTheme(id)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}

// 화면 폭 구간(600·840)은 CSS로만 바뀌므로, iframe 폭을 바꿔 미디어 쿼리를 그대로 확인한다.
export function WidthPreview({ src, id }: { src: string; id: string }) {
  const [width, setWidth] = useState<number>(PREVIEW_WIDTHS[0].width);
  const frameRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">화면 폭</span>
        {PREVIEW_WIDTHS.map((preset) => (
          <Button
            key={preset.width}
            size="sm"
            variant={width === preset.width ? "default" : "outline"}
            aria-pressed={width === preset.width}
            onClick={() => setWidth(preset.width)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border bg-muted p-2">
        <iframe
          ref={frameRef}
          id={id}
          src={src}
          title="화면 폭 미리보기"
          className="h-dvh max-h-[48rem] rounded-md border bg-background"
          style={{ width }}
        />
      </div>
    </div>
  );
}
