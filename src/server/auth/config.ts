import "server-only";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Google from "next-auth/providers/google";
import { accounts, getDb, sessions, users } from "@/server/db";
import { serverEnv } from "@/shared/config/env";

// 구글에서 받는 정보는 이메일만 저장한다(기획서 13장).
// - 사용자: 이름·사진을 버린다
// - 로그인 연결(Account): OAuth 토큰을 쓰지 않으므로 식별자만 남긴다
function emailOnlyAdapter(): Adapter {
  const adapter = DrizzleAdapter(getDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
  });
  return {
    ...adapter,
    linkAccount: ({ userId, type, provider, providerAccountId }) =>
      adapter.linkAccount!({ userId, type, provider, providerAccountId }),
  };
}

// 설정을 함수로 넘겨 첫 요청 때 만든다. 빌드에는 DB·비밀값이 없다.
export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const env = serverEnv();
  return {
    adapter: emailOnlyAdapter(),
    secret: env.AUTH_SECRET,
    // 프리뷰 로그인은 고정 주소를 거쳐 돌아온다(docs/setup.md). 환경변수를 Auth.js가
    // 직접 읽지 않게 검증한 값을 넘긴다. 로컬은 undefined
    redirectProxyUrl: env.AUTH_REDIRECT_PROXY_URL,
    providers: [
      Google({
        clientId: env.AUTH_GOOGLE_ID,
        clientSecret: env.AUTH_GOOGLE_SECRET,
        profile: (profile) => ({
          id: profile.sub,
          email: profile.email,
          name: null,
          image: null,
        }),
      }),
    ],
    // DB 세션: 탈퇴하면 세션 행을 지워 바로 로그아웃시킬 수 있다
    session: { strategy: "database" },
    pages: { signIn: "/login" },
  };
});
