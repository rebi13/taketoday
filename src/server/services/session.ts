import "server-only";
import { connection } from "next/server";
import { auth, handlers, signIn, signOut } from "@/server/auth";

export type SessionUser = { id: string; email: string };

/** `/api/auth/[...nextauth]` 라우트가 그대로 내보내는 GET·POST */
export const authRouteHandlers = handlers;

/** 로그인한 사용자. 세션이 없거나 만료됐으면 null */
export async function getSessionUser(): Promise<SessionUser | null> {
  // 세션은 요청마다 다르다. auth()가 쿠키를 읽기 전에 난수를 만들어 사전 렌더링 경고가 나므로
  // 요청 시점에 그린다고 먼저 알린다(Cache Components).
  await connection();
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.email) return null;
  return { id: user.id, email: user.email };
}

/** 구글 로그인 화면으로 보낸다. 끝나면 redirectTo로 돌아온다 */
export async function signInWithGoogle(redirectTo = "/") {
  await signIn("google", { redirectTo });
}

export async function signOutUser() {
  await signOut({ redirectTo: "/login" });
}
