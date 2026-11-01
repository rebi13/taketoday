// 온보딩 단계들의 틀. 탭 메뉴 없이 가운데 한 열로 보여준다.
export default function OnboardingLayout({
  children,
}: LayoutProps<"/onboarding">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-10 pb-[calc(var(--spacing)*6+env(safe-area-inset-bottom))]">
      {children}
    </main>
  );
}
