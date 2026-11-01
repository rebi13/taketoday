import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getAppEntry } from "@/server/services";
import { TabNav } from "@/widgets/tab-nav";

// 로그인 후 탭 화면들의 공통 틀. 840 미만은 본문 + 하단 탭바, 이상은 왼쪽 세로 메뉴 + 본문.
export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col wide:flex-row">
      <TabNav />
      {/* 하단 탭바에 가리지 않게 탭바 높이 + 홈 표시줄(safe area)만큼 비운다 */}
      <div className="flex flex-1 flex-col pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))] wide:pb-0">
        {children}
      </div>
      <Suspense>
        <RequireReady />
      </Suspense>
    </div>
  );
}

/**
 * proxy.ts는 쿠키만 본다. 세션이 실제로 유효한지, 온보딩을 마쳤는지는 여기서 확인해
 * 로그인 화면이나 남은 온보딩 단계로 보낸다
 */
async function RequireReady() {
  const entry = await getAppEntry();
  if (entry.kind === "login") redirect("/login");
  if (entry.kind === "onboarding") redirect(entry.path);
  return null;
}
