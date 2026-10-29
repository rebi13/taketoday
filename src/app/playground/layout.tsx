import { notFound } from "next/navigation";

// 디자인 시험장은 개발 환경에서만 연다 (implementation-plan 2.3 ④)
export default function PlaygroundLayout({
  children,
}: LayoutProps<"/playground">) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
