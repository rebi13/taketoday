import { Google_Sans } from "next/font/google";
import Image from "next/image";
import { cn } from "@/shared/lib/utils";
import { signInWithGoogleAction } from "./actions";

const googleSans = Google_Sans({
  weight: "500",
  subsets: ["latin"],
  variable: "--font-google-sans",
  display: "swap",
});

// 구글 로그인 브랜드 가이드를 따른다 (developers.google.com/identity/branding-guidelines)
// - 색: Light·Dark 테마 값 그대로(globals.css --google-button*), 1px 안쪽 테두리
// - 로고: 공식 표준 색 "G"(public/brand/google-g.png)를 20px로, 바꾸거나 단색으로 쓰지 않는다
// - 여백: 왼쪽 12px, 로고와 글자 사이 10px, 오른쪽 12px
// - 글자: Google Sans Medium 14/20. 문구는 "Continue with Google"을 한국어로 옮긴 것
// - 높이: 가이드의 40px을 터치 영역 규칙에 맞춰 44px로. 로고 크기와 여백은 그대로 둔다
export function GoogleSignInButton() {
  return (
    <form action={signInWithGoogleAction}>
      <button
        type="submit"
        className={cn(
          googleSans.variable,
          "inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-google-button-border bg-google-button px-3 font-google text-sm/5 font-medium text-google-button-foreground transition-colors duration-(--duration-fast) outline-none select-none hover:bg-[color-mix(in_oklch,var(--google-button),var(--google-button-foreground)_8%)] focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-[color-mix(in_oklch,var(--google-button),var(--google-button-foreground)_12%)]",
        )}
      >
        <Image
          src="/brand/google-g.png"
          alt=""
          width={20}
          height={20}
          className="size-5 object-contain"
        />
        Google 계정으로 계속하기
      </button>
    </form>
  );
}
