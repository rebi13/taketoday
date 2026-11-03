import type { Metadata, Viewport } from "next";
import { Toaster } from "@/shared/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘챙김",
  description: "해야 할 생활 일을 오늘 할 만큼만 골라 챙겨주는 서비스",
};

// 아이폰 홈 표시줄·노치 영역까지 그리고, 하단 탭바가 env(safe-area-inset-*)로 비켜 간다
export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-dvh flex flex-col">
        {children}
        {/* T04 저장했어요 같은 짧은 알림. 하단 탭바를 가리지 않게 위에 띄운다 */}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
