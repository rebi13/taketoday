import { NextResponse, type NextRequest } from "next/server";

// 세션 쿠키가 없으면 화면을 그리기 전에 S01로 보낸다.
// 쿠키만 보는 빠른 확인이라 DB를 깨우지 않는다. 세션이 유효한지는 화면에서
// getSessionUser()로 다시 확인한다.
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function proxy(request: NextRequest) {
  if (SESSION_COOKIES.some((name) => request.cookies.has(name))) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // 로그인 화면, 약관(S22, 로그인 없이 봄), Auth.js 라우트, 개발용 시험장,
  // 정적 파일(점이 들어간 경로)은 제외한다
  matcher: ["/((?!login|terms|api/|playground|_next/|.*\\..*).*)"],
};
