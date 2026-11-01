import type { Metadata } from "next";
import { TERMS_VERSION } from "@/shared/config/constants";

export const metadata: Metadata = {
  title: "약관·개인정보처리방침 · 오늘챙김",
};

// S22 약관·개인정보처리방침. 로그인 없이 볼 수 있다.
// 법률 검토 전 초안이다(기획서 17장). 출시 전에 확정한다(#41).
// 본문을 바꾸면 shared/config의 TERMS_VERSION을 올려 다시 동의받는다.
export default function TermsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-4 py-10 leading-relaxed">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">약관·개인정보처리방침</h1>
        <p className="text-sm text-muted-foreground">
          시행일 {TERMS_VERSION} · 법률 검토 전 초안이에요. 출시 전에 확정하고
          바뀌면 다시 동의를 받아요.
        </p>
      </header>

      <section id="terms" className="flex scroll-mt-6 flex-col gap-4">
        <h2 className="text-xl font-semibold">이용약관</h2>
        <Clause title="서비스">
          오늘챙김은 미루기 쉬운 생활 관리를 짧은 미션으로 나눠 매일 추천하고,
          완료한 기록에 따라 캐릭터의 방을 꾸밀 수 있는 재화를 주는 서비스예요.
        </Clause>
        <Clause title="가입">
          구글 계정으로 가입해요. 만 14세 미만은 가입할 수 없어요.
        </Clause>
        <Clause title="재화">
          재화는 미션을 완료한 다음 날 정산되고, 하루에 받을 수 있는 횟수에
          상한이 있어요. 재화는 서비스 안에서 아이템을 사는 데만 쓰며 현금
          가치가 없고, 환불하거나 다른 사람에게 넘길 수 없어요.
        </Clause>
        <Clause title="탈퇴">
          설정에서 언제든 탈퇴할 수 있어요. 탈퇴 후 30일 안에 같은 구글 계정으로
          다시 로그인하면 복구할 수 있어요.
        </Clause>
        <Clause title="약관 변경">
          약관이 바뀌면 앱에서 알리고 다시 동의를 받아요.
        </Clause>
      </section>

      <section id="privacy" className="flex scroll-mt-6 flex-col gap-4">
        <h2 className="text-xl font-semibold">개인정보처리방침</h2>
        <Clause title="모으는 정보">
          구글 로그인으로 받는 정보 중 이메일만 저장해요. 이름과 프로필 사진은
          저장하지 않아요. 그 밖에 직접 입력한 닉네임·캐릭터 이름·생활 정보(거주
          형태, 반려동물·식물 등 조건), 알림 시간과 쉬는 날, 그리고
          미션·완료·재화·방 꾸미기 같은 이용 기록을 저장해요.
        </Clause>
        <Clause title="쓰는 곳">
          로그인, 오늘의 미션 추천과 알림, 보상 정산에만 써요.
        </Clause>
        <Clause title="보관과 파기">
          탈퇴하면 바로 계정을 멈추고 통계에서 빼요. 30일이 지나면 이메일,
          로그인 연결 정보, 닉네임을 파기하고, 이용 기록은 누구의 것인지 알 수
          없게 연결을 끊어 보관해요.
        </Clause>
        <Clause title="맡기는 곳">
          서비스 운영을 위해 Vercel(서버)과 Neon(데이터베이스)을 쓰며, 데이터는
          싱가포르 지역에 저장돼요.
        </Clause>
        <Clause title="문의">출시 전에 문의처를 적어요.</Clause>
      </section>
    </main>
  );
}

function Clause({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="font-medium">{title}</h3>
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}
