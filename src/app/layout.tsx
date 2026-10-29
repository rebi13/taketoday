import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘챙김",
  description: "해야 할 생활 일을 오늘 할 만큼만 골라 챙겨주는 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
