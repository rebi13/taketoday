import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { getSessionUser, signOutUser } from "@/server/services";
import { Button } from "@/shared/ui/button";

// S20 설정. 알림 시간·쉬는 날·P21 로그아웃 확인은 #36에서 만든다. 지금은 계정과 로그아웃만.
export default function SettingsPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-4 pt-4">
      <header className="flex items-center gap-1">
        <Button asChild variant="ghost" size="icon" aria-label="홈으로">
          <Link href="/">
            <ChevronLeft aria-hidden />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">설정</h1>
      </header>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">계정</h2>
        <Suspense>
          <AccountEmail />
        </Suspense>
        <div>
          <Button asChild variant="link">
            <Link href="/terms">약관·개인정보처리방침</Link>
          </Button>
        </div>
        <form action={logout}>
          <Button type="submit" variant="outline">
            로그아웃
          </Button>
        </form>
      </section>
    </main>
  );
}

async function AccountEmail() {
  const user = await getSessionUser();
  return user ? <p>{user.email}</p> : null;
}

async function logout() {
  "use server";
  await signOutUser();
}
