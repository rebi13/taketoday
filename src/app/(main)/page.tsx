import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSessionUser, signOutUser } from "@/server/services";
import { Button } from "@/shared/ui/button";

// S10 홈. M0에서는 로그인 확인용 빈 화면이다.
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">오늘챙김</h1>
      <Suspense>
        <SignedInUser />
      </Suspense>
    </main>
  );
}

async function SignedInUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <>
      <p className="text-muted-foreground">{user.email}로 로그인했어요</p>
      {/* S20 설정과 P21 로그아웃 확인이 생기면 그쪽으로 옮긴다 */}
      <form action={logout}>
        <Button type="submit" variant="outline">
          로그아웃
        </Button>
      </form>
    </>
  );
}

async function logout() {
  "use server";
  await signOutUser();
}
