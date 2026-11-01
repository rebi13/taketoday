import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GoogleSignInButton } from "@/features/sign-in";
import { getSessionUser } from "@/server/services";

// S01 랜딩. 소셜 로그인만 쓰고 MVP는 구글 하나다(screen-flow).
export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold">오늘챙김</h1>
        <p className="text-muted-foreground">
          미루던 생활 관리를 오늘 할 만큼만 챙겨 드려요
        </p>
      </div>
      {/* 카카오·네이버 버튼이 이 아래에 붙는다(기획서 9장) */}
      <div className="grid w-full max-w-sm gap-3">
        <GoogleSignInButton />
        <Suspense>
          <LoginError searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

/** 이미 로그인했으면 홈으로 보낸다 */
async function RedirectIfSignedIn() {
  if (await getSessionUser()) redirect("/");
  return null;
}

/** 로그인에 실패하면 Auth.js가 ?error=... 를 붙여 이 화면으로 돌려보낸다 */
async function LoginError({
  searchParams,
}: Pick<PageProps<"/login">, "searchParams">) {
  const { error } = await searchParams;
  if (!error) return null;
  return (
    <p role="alert" className="text-center text-sm text-muted-foreground">
      로그인하지 못했어요. 잠시 뒤에 다시 시도해 주세요.
    </p>
  );
}
