# 오늘챙김 MVP 구현 계획

> 2026-10-28 · 원종석
> [기획서](plan.md)가 "무엇을"을, 이 문서가 "어떻게·어떤 순서로"를 다룬다. 기간은 산정하지 않고 작업 순서와 완료 기준만 둔다.

## 변경 이력

| 날짜 | 내용 |
|---|---|
| 2026-10-29 | Next.js 16 앱 생성, pnpm 스크립트(typecheck는 `next typegen` 후 tsc), Prettier(Markdown 제외), Vitest, commitlint·husky 적용 |
| 2026-10-29 | 커밋 규칙 확정: docs/commit-convention.md, commitlint.config.mjs (M0에서 commitlint·husky 설치) |
| 2026-10-28 | 폴더블(폴드·플립) 대응 반응형 규칙 추가 (2.3 ⑤·⑥) |
| 2026-10-29 | 완료 기준 내 기준으로 바꾸기·되돌리기를 M1에 추가 |
| 2026-10-29 | 취소한 미션의 같은 날 다시 완료를 서비스·테스트에 반영(5.3) |
| 2026-10-29 | 저장소 초기 문서 준비: docs/(plan, implementation-plan, screen-flow, ADR 0001~0006), CLAUDE.md, seed/ JSON 6종 + zod 검증 |
| 2026-10-29 | 프로젝트 구조 확정: widgets 층 추가, import 방향·server-only·슬라이스 공개 규칙 (3장) |
| 2026-10-29 | 캐릭터를 부위별 SVG + Motion 대기 애니메이션으로 구현하도록 반영 |
| 2026-10-29 | 탈퇴 처리(비활성화 → 30일 뒤 식별정보 파기), 소프트 삭제, 오프라인 완료 반영 |
| 2026-10-29 | 재알림 → 저녁 알림(21:00 KST, QStash 일일 스케줄 1개로 일괄 처리). QStash 사용량 재계산 |
| 2026-10-28 | UI를 Tailwind CSS + shadcn/ui로 확정. 디자인 시스템 규칙(2.3) 추가 |
| 2026-10-28 | 알림 구조 변경: 10분 폴링 → 하루 1회 QStash 지연 메시지 예약 (Neon 무료 컴퓨트 한도 보호). 요금 검토 추가 |
| 2026-10-28 | 초안 작성. Next.js + Neon + QStash 구성, 마일스톤 M0~M7 |

---

## 1. MVP 범위 요약

기획서 기준 MVP에 들어가는 것만 모았다.

| 영역 | 포함 |
|---|---|
| 계정 | 구글 OAuth 로그인, 온보딩(구역·조건 태그·알림 시간·캐릭터 3종) |
| 미션 | 기본 미션 99개, 커스텀 미션(주기형·기한형), 켜기·끄기·주기 수정 |
| AI | AI로 미션 만들기 (하루 20회) |
| 추천·알림 | 오늘의 추천(DailyMission), Web Push(기본 알림 + 21:00 저녁 알림), 쉬는 날, 무반응 시 줄이기 |
| 수행 | 완료 / 내일로 / 당일 취소, 날짜별 기록 |
| 보상 | 다음 날 정산(하루 10회, 미션별 1회), 재화 잔액 |
| 방꾸미기 | 상점 30종, 인벤토리, 슬롯 10개 배치, 시작 선물, 캐릭터 반응 |

**MVP 제외** (구조만 대비): 공유 리스트, 자유 배치 에디터, 뽑기, 보너스 룰렛, 행동 분석 코치, 소셜, 카카오·네이버 로그인.

## 2. 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | **Next.js (App Router) + TypeScript** | 화면과 API를 한 저장소에서. Route Handler·Server Action으로 백엔드를 겸함 |
| 호스팅 | **Vercel** | Next.js 배포가 가장 단순. 프리뷰 배포로 기능별 확인 |
| DB | **Neon (Postgres) Free 플랜** ✅ | DB 용도로만 사용. 인증·예약 작업·API는 Neon 기능을 쓰지 않고 Auth.js, Vercel, QStash가 맡음 |
| ORM | **Drizzle ORM** + `@neondatabase/serverless` | 서버리스 환경에서 가볍고, SQL에 가까워 정산 같은 집계 쿼리를 다루기 쉬움 |
| 인증 | **Auth.js** (Google provider, Drizzle adapter) | 기획서의 User·Account 분리 구조가 Auth.js 기본 모델과 같음. Kakao·Naver provider도 공식 제공 |
| 예약 작업 | **QStash** (알림) + **Vercel Cron** (정산 백업) | 아래 2.1 참고 |
| 푸시 | Web Push (VAPID) + `web-push` 라이브러리 | 별도 푸시 서비스 없이 표준 방식 |
| PWA | Web App Manifest + 서비스 워커 (Serwist 등) | 홈 화면 추가, 푸시 수신, 오프라인 셸 |
| 서버 상태 | TanStack Query | 완료·취소 같은 낙관적 업데이트 |
| UI | **Tailwind CSS + shadcn/ui** ✅ | 컴포넌트 소스를 저장소에 두고 직접 고침. 토큰만 바꿔 여러 디자인을 시험하기 쉽고, 방·캐릭터 같은 직접 그린 화면과 톤을 맞추기 쉬움 (2.3) |
| 아이콘·폰트·모션 | lucide-react, Pretendard, Motion(구 Framer Motion) | shadcn 기본 아이콘, 한글 가독성, 캐릭터 대기 움직임·반응 전환·보상 연출 |
| 검증 | zod | API 입력, AI 출력 JSON, 시드 데이터 검증을 한 스키마로 |
| 날짜 | `@date-fns/tz` | 모든 "하루" 계산을 Asia/Seoul 기준 localDate로 통일 |
| AI | 저가 경량 LLM (structured output 지원) | 호출을 `server/ai` 모듈 하나로 감싸 모델 교체 가능하게 |
| 테스트 | Vitest (도메인 로직) + Playwright (핵심 흐름 몇 개) | 정산·추천·상한은 순수 함수 단위 테스트로 보장 |
| 모니터링 | Sentry (에러) | 출시 직전 도입 |

### 2.1 예약 작업 구성

**원칙: 예약 작업이 DB를 자주 깨우지 않게 한다.** Neon Free는 5분 동안 요청이 없으면 컴퓨트가 멈추고, 깨어 있는 시간만큼 CU-hour를 쓴다(프로젝트당 월 100 CU-hours). 한도를 다 쓰면 과금되지 않고 **다음 주기까지 DB가 멈춘다**. 따라서 무료로 운영하려면 "몇 분마다 DB를 조회하는" 작업을 피해야 한다.

| 작업 | 주기 | 실행 수단 | 비고 |
|---|---|---|---|
| 정산 + 알림 예약 | 하루 1회 (밤) | Vercel Cron → `/api/jobs/daily` | ① 접속하지 않은 사용자의 미정산 날짜 정산 ② 다음 24시간의 사용자별 알림을 QStash 지연 메시지로 예약 |
| 지연 정산 | 사용자 요청 시 | 앱 서버 | 다음 날 첫 요청에서 미정산 날짜를 찾아 정산. 기본 경로 |
| 기본 알림 발송 | 사용자별 알림 시각 | QStash 지연 메시지 → `/api/jobs/notify` | 예약된 시각에만 호출되므로, 알림 받을 사용자가 없는 시간에는 DB가 깨지 않음 |
| 저녁 알림 | 매일 21:00 KST | QStash 스케줄 1개(cron `0 12 * * *`, UTC 12:00 = KST 21:00) → `/api/jobs/evening` | 오늘 추천 중 대기 상태 미션이 있는 사용자를 한 번에 조회해 발송. **하루 한 번만 DB를 깨움** |

- Vercel Hobby cron은 하루 1회까지, 실행 시각이 최대 59분 어긋날 수 있다. 그래서 정산은 지연 정산을 기본 경로로 두고, 알림 예약은 **실행 시점부터 24시간 뒤까지**를 예약해 시각 오차와 무관하게 만든다.
- 사용자가 알림 시간·쉬는 날을 바꾸면 그 자리에서 예약된 메시지를 취소하고 새로 예약한다(메시지 id를 users에 저장).
- 감쇠 규칙(3일 무반응 → 저녁 알림 끔, 7일 → 기본 알림 격일)은 기본 알림 예약과 저녁 알림 대상 조회에 적용한다.
- 저녁 알림 대상에서 제외: 쉬는 날, 기본 알림 시각이 20:00 이후인 사용자, 오늘 추천을 모두 처리한 사용자, 푸시 구독이 없는 사용자.
- 사용자가 많아지면 저녁 알림 발송을 50명 단위로 나눠 QStash 메시지로 쪼갠다(함수 실행 시간 제한 대비).
- QStash 요청은 서명 검증 후에만 처리한다. Cron 엔드포인트도 비밀 헤더로 보호한다. 모든 작업은 중복 실행돼도 결과가 같도록(멱등) 만든다.

### 2.2 요금 검토 (무료 플랜 기준)

| 서비스 | 무료 한도 | 이 서비스 사용량 | 요금 |
|---|---|---|---|
| Vercel Hobby | Cron은 모든 플랜 포함, 함수 사용량은 플랜 한도 적용 | Cron 하루 1회 + 앱 요청 | 없음 |
| QStash Free | 하루 메시지 1,000건 | 사용자당 하루 1건(기본 알림) + 저녁 알림 스케줄 1건 | 없음. **사용자 약 900명**까지. 넘으면 요금제를 바꿔야 하며 종량제는 10만 건당 $1 |
| Neon Free | 프로젝트당 월 100 CU-hours, 스토리지 1GB | 사용자 요청 + 알림 시각에만 깨어남 | 없음. 초과 시 과금 대신 DB 중지 |

- 무료 플랜은 한도를 넘어도 자동으로 요금이 청구되지 않는다. 대신 Neon은 DB가 멈추고, QStash는 메시지가 거부된다. **요금보다 "한도 초과로 서비스가 멈추는 것"이 실제 위험**이다.
- 사용량은 Neon 콘솔의 CU-hours를 주 1회 확인하고, 월 70%를 넘으면 대응(유료 전환 또는 요청 최적화)을 결정한다.

**참고: 처음 안(10분마다 폴링)을 버린 이유**
10분마다 알림 작업을 돌리면 호출마다 DB가 깨어나 5분간 유지되므로, 하루의 절반 이상(약 13시간) DB가 켜져 있게 된다. 가장 작은 컴퓨트(0.25 CU로 가정)로도 월 약 100 CU-hours라, 사용자 요청이 없어도 무료 한도를 다 쓴다.

### 2.3 UI·디자인 시스템 규칙

디자인을 여러 번 바꿔 보고, 나중에 테마를 늘려도 화면 코드를 고치지 않도록 다섯 가지를 정해 둔다.

#### ① 디자인 토큰: 값은 한곳에만

색, 둥글기, 그림자, 모션 시간은 CSS 변수로 한 파일(`src/app/globals.css`)에만 정의하고, 화면 코드에는 값을 직접 쓰지 않는다. 이름은 "어떤 색"이 아니라 "무슨 역할"로 짓는다.

```css
:root {
  /* 기본 (shadcn 규칙) */
  --background: #fffaf3;
  --foreground: #3b3a36;
  --primary: #f2994a;          /* 주요 버튼, 완료 */
  --primary-foreground: #ffffff;
  --muted: #f3eee6;
  --border: #e8e1d6;
  --radius: 1rem;              /* 전체 둥글기 기준 */

  /* 서비스 전용 역할 */
  --reward: #e9b949;           /* 재화, 보상 */
  --pending: #9bb7d4;          /* 적립 예정 */
  --postponed: #c9c2b8;        /* 내일로 */
  --zone-kitchen: #f4a261;     /* 구역 배지 색 */
  --zone-bathroom: #7fb7be;

  /* 그림자·모션 */
  --shadow-card: 0 2px 0 rgb(0 0 0 / 0.06);
  --duration-fast: 150ms;
  --duration-reward: 600ms;    /* 보상 연출 */
}

/* 테마를 바꾸면 변수 값만 덮어쓴다 */
[data-theme="night-desk"] {
  --background: #1f2a44;
  --foreground: #f5f1e8;
  --primary: #f6c945;
}
```

- 화면에서는 `bg-primary`, `text-reward`, `rounded-[--radius]`처럼 **토큰 이름으로만** 쓴다. `bg-[#f2994a]` 같은 직접 값은 쓰지 않는다(코드 리뷰 체크, 가능하면 린트로 막음).
- 테마는 `<html data-theme="...">` 한 곳만 바꾸면 앱 전체에 반영된다. 기획서의 세트 테마(포근한 아침, 초록 방, 밤의 책상)를 앱 색 테마로 넓히는 것도 이 방식으로 가능하다.
- MVP는 라이트 테마 하나로 시작하고, 다크 모드는 같은 구조로 나중에 추가한다.

#### ② 컴포넌트 변형: 모양의 경우의 수를 미리 정의

버튼이나 미션 카드처럼 여러 모양이 있는 컴포넌트는 `cva`로 변형을 정의하고, 사용하는 쪽은 변형 이름만 고른다. 새 모양이 필요하면 변형을 추가하지, 사용하는 곳에서 클래스를 덧붙이지 않는다.

```tsx
// entities/mission/ui/mission-card.tsx
const missionCard = cva(
  "rounded-[--radius] border p-4 transition-colors duration-[--duration-fast]",
  {
    variants: {
      status: {
        pending:   "bg-background border-border",
        done:      "bg-muted border-transparent opacity-80",
        postponed: "bg-background border-dashed border-postponed",
        canceled:  "bg-background border-border line-through opacity-60",
      },
      size: {
        default: "p-4",
        compact: "p-3 text-sm",   // 내 미션 목록용
      },
    },
    defaultVariants: { status: "pending", size: "default" },
  },
);

<MissionCard status="done" size="compact" />
```

- 상태 값(`pending`, `done` ...)은 DB의 DailyMission 상태와 같은 이름을 쓴다. 기획·DB·UI가 같은 단어를 공유한다.

#### ③ 계층: 원본, 서비스 컴포넌트, 화면을 나눈다

| 위치 | 담는 것 | 규칙 |
|---|---|---|
| `shared/ui/` | shadcn에서 가져온 원본 (Button, Dialog, Sheet, Tabs, Toast ...) | 수정은 토큰 연결과 공통 변형 추가까지만. 도메인 단어가 들어가지 않는다 |
| `entities/*/ui/` | 미션 카드, 아이템 카드, 재화 표시, 캐릭터 등 | `shared/ui`를 조합해 만든다. 데이터 하나를 보여주는 단위 |
| `features/*/ui/` | 완료 버튼, 슬롯 선택 시트, AI 미션 입력창 등 | 동작(서버 호출)을 가진 단위 |
| `app/` | 화면 | 위 컴포넌트 배치만 한다. 스타일을 거의 쓰지 않는다 |

- 이렇게 나누면 shadcn을 업데이트하거나 디자인을 갈아엎을 때 `shared/ui`와 토큰만 보면 된다.

#### ④ 디자인 시험장: `/playground`

- 개발 환경에서만 열리는 `/playground` 페이지에 **토큰 견본(색·둥글기·그림자), 모든 컴포넌트의 모든 변형, 테마 전환 버튼**을 모아 둔다.
- 새 디자인 시안을 시험할 때는 토큰 값을 바꿔 이 페이지 하나로 전체 인상을 확인한다. AI로 뽑은 시안도 여기에 붙여 비교한다.
- 컴포넌트가 많아지면 Storybook으로 옮긴다.

#### ⑤ 화면 기준

- **터치 영역**: 버튼 높이 최소 44px. 완료 버튼은 한 손 엄지로 닿는 화면 아래쪽에 둔다.
- **모션**: 보상·캐릭터 반응에만 쓰고, 시스템의 "동작 줄이기" 설정(`prefers-reduced-motion`)을 켠 사용자에게는 끈다.
- **방 화면 레이어**: 슬롯 10개를 절대 위치 레이어로 쌓는다. 레이어 순서(z-index)도 토큰처럼 한 파일에 정의한다(벽지 < 창밖 < 벽 장식 < 가구 < 바닥 소품 < 캐릭터).

#### ⑥ 반응형: 폴더블까지

폴더블 폰 때문에 같은 폰에서도 화면 비율이 크게 바뀐다. 기기 이름이 아니라 **화면 폭과 높이 구간**으로 대응한다.

**대상 화면 예시**

| 기기 상태 | CSS 뷰포트 (대략) | 특징 |
|---|---|---|
| 일반 폰 | 360~430 × 750~930 | 기준 화면 |
| 플립 펼침 (Z Flip7) | 360 × 840 | 폭은 좁고 세로가 매우 긺 |
| 폴드 접힘 (커버 화면) | 일반 폰과 비슷한 폭 | 세로가 긴 편 |
| 폴드 펼침 (Z Fold7) | 984 × 1092 | 거의 정사각형, 태블릿급 폭 |
| 가로 모드 폰 | 높이 400 안팎 | 세로 공간이 매우 짧음 |

**폭 구간 (레이아웃을 바꾸는 기준)**

| 구간 | 폭 | 레이아웃 |
|---|---|---|
| 좁음 | 600 미만 | 한 열. 하단 탭바 |
| 중간 | 600~839 | 한 열을 넓게 쓰되 카드 목록은 2열. 하단 탭바 |
| 넓음 | 840 이상 | **두 영역 분할**. 홈은 왼쪽 방·오른쪽 오늘의 추천, 미션 목록은 왼쪽 목록·오른쪽 상세, 상점은 왼쪽 방 미리보기·오른쪽 상품 목록. 탭바는 왼쪽 세로 내비게이션으로 |

- 폭 구간은 Android의 창 크기 등급(600, 840 기준)을 따른다. 폴드를 펼친 화면(약 984)이 "넓음"에 들어가 태블릿과 같은 레이아웃을 쓴다.
- 처음 계획의 "데스크톱은 최대 480px 가운데 정렬"은 넓음 구간에서 두 영역 분할로 바꾼다. 폴드를 펼쳤는데 가운데만 좁게 쓰면 큰 화면을 쓰는 이유가 없어진다.

**높이 대응**

- 화면 높이는 `100vh` 대신 `100dvh`를 쓴다. 모바일 브라우저 주소창이 나타나고 사라질 때 높이가 튀지 않는다.
- **세로가 긴 화면(플립)**: 방 영역은 비율을 고정하고, 남는 세로 공간은 오늘의 추천 목록이 가져간다. 방이 늘어나 화면을 다 차지하지 않게 한다.
- **세로가 짧은 화면(가로 모드, 높이 500 미만)**: 상단 헤더를 줄이고, 방은 작게 접은 미리보기로 바꾼다. 완료 버튼은 항상 보이게 한다.

**방 화면은 비율 고정 캔버스로**

- 방은 고정 비율(예: 4:3) 영역 안에 그리고, 슬롯 위치와 크기는 **영역 대비 % 값**으로 정의한다. 그러면 어떤 화면 크기에서도 배치가 깨지지 않는다.
- 2단계 자유 배치의 그리드 좌표도 같은 % 기준을 쓰면 슬롯 → 좌표 변환이 단순해진다.

**구현 규칙**

- 페이지 레이아웃은 미디어 쿼리(화면 폭)로, 카드·상품 목록처럼 놓이는 자리에 따라 달라지는 컴포넌트는 **컨테이너 쿼리**로 대응한다. 같은 상품 카드가 좁은 화면과 넓은 화면의 오른쪽 영역에서 각자 맞게 보인다.
- 화면 크기를 JS로 계산해 상태에 저장하지 않는다. 폴드를 접고 펼치면 화면 크기가 바로 바뀌는데, CSS로 대응해야 새로고침 없이 자연스럽게 따라간다. 접고 펼칠 때 입력 중인 내용이나 열린 시트가 사라지지 않아야 한다.
- 폴드를 반쯤 접은 자세(플렉스 모드)의 접힘선 대응은 브라우저 지원이 아직 제한적이라 MVP에서는 하지 않는다. 대신 중요한 버튼이 화면 정가운데 가로선에 걸리지 않게만 배치한다.

**테스트**

- 개발 중: Chrome 개발자 도구의 기기 모드에서 폴드·플립 프리셋과 위 표의 크기로 확인한다. `/playground`에 화면 폭 전환 버튼을 둔다.
- 실기기: 삼성 원격 테스트 랩(실제 갤럭시 기기를 원격으로 쓰는 서비스) 또는 주변 기기로, 접기·펼치기 전환까지 확인한다.

## 3. 프로젝트 구조 ✅

화면 쪽은 FSD(Feature-Sliced Design)를 가볍게 줄인 구조, 서버 쪽은 `server/`로 분리한다. FSD의 `pages` 층은 두지 않고 Next.js의 `app/`이 그 역할을 한다.

```
taketoday/
├─ src/
│  ├─ app/                      # Next.js 라우팅 전용 (화면 조립만)
│  │  ├─ (auth)/login/
│  │  ├─ onboarding/
│  │  ├─ (main)/                # 탭바가 있는 레이아웃
│  │  │  ├─ page.tsx            # 홈
│  │  │  ├─ missions/           # 내 미션 목록·상세·만들기·AI
│  │  │  ├─ records/
│  │  │  ├─ room/               # 방 꾸미기, room/shop 상점
│  │  │  └─ settings/
│  │  ├─ playground/            # 개발 환경 전용 디자인 시험장 (2.3 ④)
│  │  └─ api/
│  │     ├─ auth/[...nextauth]/
│  │     └─ jobs/               # daily(Vercel Cron), notify·evening(QStash)
│  │
│  ├─ widgets/                  # 화면의 큰 덩어리
│  │  ├─ room-view/             # 방 + 캐릭터 + 슬롯 레이어
│  │  ├─ today-recommendations/ # 오늘의 추천 목록
│  │  └─ tab-nav/               # 하단 탭바 ↔ 왼쪽 세로 메뉴
│  │
│  ├─ features/                 # 사용자 동작 하나 (서버 호출 포함)
│  │  ├─ complete-mission/      # 완료·되돌리기
│  │  ├─ postpone-mission/      # 내일로
│  │  ├─ create-mission/        # 직접 만들기
│  │  ├─ ai-draft-mission/      # AI로 만들기
│  │  ├─ purchase-item/
│  │  └─ place-item/            # 슬롯에 놓기
│  │
│  ├─ entities/                 # 데이터 하나를 보여주는 단위
│  │  ├─ mission/               # 미션 카드, 타입, 구역 배지
│  │  ├─ item/                  # 아이템 카드
│  │  ├─ character/             # 캐릭터 SVG + 대기 움직임 + 반응
│  │  └─ wallet/                # 재화 표시, 적립 예정 n/10
│  │
│  ├─ shared/                   # 도메인을 모르는 공통 코드
│  │  ├─ ui/                    # shadcn 원본 컴포넌트 (2.3 ③)
│  │  ├─ lib/                   # 날짜(localDate), 포맷, cn 등
│  │  └─ config/                # 상수, 환경변수 검증(zod)
│  │
│  └─ server/                   # 서버에서만 실행 ('server-only')
│     ├─ db/                    # Drizzle 스키마, 클라이언트, 마이그레이션
│     ├─ domain/                # 순수 함수: 정산, 추천, 상한, 알림 대상 (DB 의존 없음)
│     ├─ services/              # 트랜잭션 단위: completeMission, settleDay, purchaseItem ...
│     ├─ ai/                    # LLM 래퍼, 프롬프트, 출력 스키마
│     ├─ push/                  # web-push, QStash 래퍼
│     └─ auth/                  # Auth.js 설정, 세션 헬퍼, canAccessList()
│
├─ seed/                        # 기본 미션 99개, 구역 14개, 아이템 30종, 캐릭터 3종 (JSON)
├─ public/                      # 아이템 이미지, 매니페스트 아이콘
├─ tests/e2e/                   # Playwright (도메인 단위 테스트는 server/domain 옆에 둔다)
└─ docs/
   ├─ plan.md                   # 기획서
   ├─ implementation-plan.md    # 이 문서
   ├─ screen-flow.md            # 화면 흐름 (mermaid)
   └─ adr/                      # 기술 결정 기록
```

### 3.1 규칙

1. **가져오기(import)는 위에서 아래로만**: `app → widgets → features → entities → shared`. 같은 층끼리도 서로 가져오지 않는다(예: `features/a`가 `features/b`를 가져오지 않음). ESLint 규칙(eslint-plugin-boundaries 등)으로 강제한다.
2. **화면 코드는 `server/services`만 부른다.** Server Action·Route Handler에서 서비스 함수를 호출하고, 화면에서 DB나 도메인 함수를 직접 쓰지 않는다. `server/` 파일에는 `import 'server-only'`를 넣어 클라이언트 번들에 섞이면 빌드가 실패하게 한다.
3. **`server/domain`은 DB를 모른다.** 입력을 받아 결과만 돌려주는 순수 함수로 두고, 같은 폴더에 테스트를 둔다.
4. **각 슬라이스는 `index.ts`로만 밖에 공개**한다. 다른 곳에서는 슬라이스 내부 파일 경로를 직접 가져오지 않는다.

### 3.2 예시: "미션 완료"가 지나가는 길

| 위치 | 하는 일 |
|---|---|
| `widgets/today-recommendations` | 추천 카드 목록을 그림 |
| `features/complete-mission` | 완료 버튼, 낙관적 업데이트, T01 되돌리기 토스트, Server Action 호출 |
| `entities/mission` | 미션 카드 모양 (`status="done"`) |
| `entities/character` | 기쁨 반응으로 전환 |
| `server/services/completeMission` | 세션 확인 → 오늘 날짜 계산 → completion 저장, 한 트랜잭션 |
| `server/domain` | "오늘 이미 적립 예정인지", "적립 예정 몇 개인지" 계산 |

- `widgets/` 층을 둔 이유: 넓은 화면(폴드 펼침)에서 홈을 "왼쪽 방, 오른쪽 추천"으로 나눌 때, 방 영역과 추천 영역을 각각 한 덩어리로 옮겨 붙일 수 있어야 하기 때문이다.

## 4. 데이터베이스

기획서 11장 기준 MVP 테이블. Auth.js가 요구하는 테이블(users, accounts, sessions, verification_tokens)을 그대로 쓰고, 서비스 필드는 users에 추가한다.

| 테이블 | 핵심 제약 |
|---|---|
| users | timezone 기본 `Asia/Seoul`, notify_time, 예약된 알림 메시지 id, daily_recommend_count 기본 2 |
| accounts | (provider, provider_account_id) 유니크 — Auth.js 기본 |
| zones, mission_templates | 시드로만 변경 |
| mission_lists | owner_type(`user` / `group`), MVP는 `user`만 생성 |
| missions | kind(`recurring` / `once`), cycle_days 또는 due_date 중 하나 필수(CHECK), created_by(`user` / `ai`), assignment 관련 컬럼 nullable |
| daily_missions | (user_id, mission_id, local_date) 유니크 |
| completions | local_date 인덱스, canceled_at, settlement_id nullable |
| daily_settlements | **(user_id, local_date) 유니크** — 중복 정산 방지의 핵심 |
| wallet_transactions | reason enum에 `personal_reward`, `shared_reward`, `purchase` 등 미리 정의 |
| items, inventories | inventories (user_id, item_id) 유니크 |
| room_placements | (user_id, slot_key) 유니크 |
| character_types, characters | 시드 3종 |
| push_subscriptions | endpoint 유니크, 만료(410) 시 삭제 |
| notification_logs | (user_id, local_date, kind) 유니크 |
| user_rest_days | (user_id, weekday) 유니크 |
| (공통) | users에 status(`active` / `deactivated`), deactivated_at. 통계 쿼리는 `active`만 집계. missions에 deleted_at(소프트 삭제), template_version과 user_modified(기본 미션 변경 반영용) |
| ai_requests | (user_id, local_date) 인덱스 — 하루 20회 카운트 |

- Neon 브랜치: `main`(운영) / `dev`(개발) 두 개로 시작한다. Free 플랜은 브랜치 10개까지라, 프리뷰마다 브랜치를 만드는 방식은 쓰지 않는다.
- 마이그레이션은 drizzle-kit으로 생성하고 커밋한다. 운영 반영은 배포 파이프라인에서만.
- 탈퇴 30일 경과 계정의 식별정보 파기는 매일 도는 `/api/jobs/daily`에 포함한다(별도 예약 작업을 늘리지 않음).
- 오프라인 완료는 서비스 워커에서 큐에 쌓았다가 재연결 시 전송한다. 요청에 기기의 완료 시각을 담고, 서버는 그 날짜가 이미 정산됐으면 거부한다.

## 5. 핵심 로직 명세

구현 전에 함수 단위로 입출력을 고정해 두고, 각 함수에 테스트 케이스를 먼저 쓴다.

### 5.1 정산 `settleDay(completions, cap = 10)`
- 입력: 그날의 completion 목록. 출력: 인정된 completion id 목록, 지급액.
- 규칙: canceled 제외 → completed_at 순 정렬 → mission_id별 첫 건 → 앞에서 cap개.
- 테스트 케이스: 취소 후 재완료, 같은 미션 3번 완료, 11개 완료, 모두 취소, 자정 직전·직후 완료.

### 5.2 추천 `pickRecommendations(missions, history, today, count)`
- 주기형: 밀린 정도 = (오늘 − 마지막 수행일) ÷ 주기. 기한형: 마감 3일 전부터 후보, 마감이 가까울수록 우선.
- 같은 구역 중복 금지, 전날 "내일로" 미션 우선, 계절 태그 반영.
- 결과는 그날 첫 생성 시 daily_missions에 저장하고 하루 동안 고정.

### 5.3 완료·취소 `completeMission` / `cancelCompletion`
- 완료: completion 생성, daily_mission 상태 갱신, "적립 예정" 수 반환.
- 취소: `local_date == 오늘`일 때만 허용, canceled_at 기록, daily_mission 상태를 취소로.
- 다시 완료: 취소 상태의 daily_mission도 같은 날이면 완료할 수 있다. 새 completion을 만들고 상태를 완료로 되돌린다. 정산은 미션별 첫 1건만 인정하므로 중복 보상은 없다.
- 테스트 케이스: 완료 → 취소 → 다시 완료가 적립 예정 1건으로 계산되는지, 자정 이후 어제 미션은 취소·다시 완료가 모두 거부되는지.

### 5.4 구매 `purchaseItem`
- 한 트랜잭션: 잔액 계산 → 부족하면 거부 → 음수 거래 생성 → 인벤토리 추가. 유니크 제약 위반은 "이미 보유"로 변환.

### 5.5 알림 예약 `planNotifications(users, logs, from, to)`
- 입력 구간(다음 24시간) 안에 알림 시각이 있고, 쉬는 날이 아니며, 감쇠 규칙(7일 무반응 → 격일)을 통과한 사용자의 기본 알림 발송 시각 목록.
### 5.5-2 저녁 알림 대상 `selectEveningTargets(today)`
- 오늘 daily_missions 중 대기 상태가 1개 이상이고, 쉬는 날이 아니며, 기본 알림 시각이 20:00 이전이고, 3일 연속 무반응이 아닌 사용자.
- 문구에 남은 개수를 넣는다. 테스트 케이스: 모두 완료, 일부 내일로, 기본 알림 21:30 설정, 쉬는 날, 오늘 처음 가입해 추천이 없는 사용자.

### 5.6 AI 미션 만들기 `draftMissionsFromText(text)`
- 하루 20회 확인 → LLM 호출(JSON 스키마 지정) → zod 검증 → 실패 시 1회 재시도 후 수동 폼 안내.
- 결과는 저장하지 않고 미리보기로 반환. 저장은 일반 커스텀 미션 생성 API를 탄다.
- 오늘 날짜(KST)를 프롬프트에 넣어 "금요일까지" 같은 상대 날짜를 해석하게 한다.

## 6. 작업 순서 (마일스톤)

각 마일스톤은 배포 가능한 상태로 끝낸다. 완료 기준을 모두 만족해야 다음으로 넘어간다.

### M0. 기반
- 저장소, ESLint·Prettier(층 간 import 규칙 포함), 커밋 규칙, GitHub Actions(타입 체크·린트·테스트)
- Next.js 앱 생성, Vercel 연결, Neon 프로젝트·브랜치, Drizzle 설정
- Auth.js + 구글 로그인, 세션 보호 라우트
- Tailwind + shadcn/ui 설정, 디자인 토큰 1차안, Pretendard, `/playground` 페이지
- `docs/adr/` 시작: 스택 선택 기록

**완료 기준**: 프리뷰 배포에서 구글 로그인 후 빈 홈이 보인다. CI가 PR마다 돈다. `/playground`에서 토큰 값을 바꾸면 모든 기본 컴포넌트에 반영된다.

### M1. 미션 기반
- 시드: 구역 14개, 기본 미션 99개, 캐릭터 3종 (zod로 검증 후 삽입)
- 온보딩: 거주 형태·조건 태그 → 기본 켬 미션 활성화, 알림 시간, 캐릭터 선택
- 내 미션 목록: 구역별 보기, 켜기·끄기, 주기 수정
- 완료 기준 "내 기준으로 바꾸기"(P25)와 "기본 기준으로 되돌리기". 고치면 missions.user_modified = true
- 커스텀 미션 생성·수정 (주기형·기한형)

**완료 기준**: 새 계정으로 온보딩을 마치면 조건에 맞는 미션이 켜져 있고, 커스텀 미션을 추가·수정할 수 있다.

### M2. 오늘의 추천과 수행
- `pickRecommendations` + daily_missions 저장
- 홈: 추천 카드, 완료·내일로, 적립 예정 n/10
- 당일 취소, 날짜별 기록 화면, 구역별 마지막 수행일

**완료 기준**: 하루를 시뮬레이션(테스트에서 날짜 주입)했을 때 추천이 하루 동안 고정되고, 내일로 미션이 다음 날 우선된다.

### M3. 정산과 재화
- `settleDay` + 지연 정산 + `/api/jobs/daily` (Vercel Cron, 미접속 사용자 정산)
- 재화 잔액, 다음 날 "어제 보상 도착" 연출
- 정산 관련 테스트 케이스 전부 통과

**완료 기준**: 완료 → 취소 → 다음 날 반복해도 재화가 생기지 않는다. 같은 날 정산을 두 번 호출해도 한 번만 지급된다.

### M4. 방과 상점
- 아이템 30종 시드 (처음엔 단색 도형 임시 에셋)
- 방 화면: 기본 배경 + 슬롯 10개 레이어
- 캐릭터 컴포넌트: 부위별 SVG, 대기 움직임(숨쉬기·깜빡임·귀/꼬리), 반응 7종 전환. 처음엔 단순 도형 캐릭터로 구조만 만들고, 캐릭터 시트가 나오면 교체
- 움직임 제어: `prefers-reduced-motion`이면 정지, 화면이 안 보이면(`visibilitychange`) 일시정지
- 상점: 카테고리, 가격, 보유 여부, 구매
- 인벤토리와 슬롯 배치, 시작 선물 지급

**완료 기준**: 재화로 아이템을 사서 슬롯에 놓으면 방에 반영된다. 잔액 부족·중복 구매가 서버에서 막힌다. 캐릭터가 대기 중 계속 움직이고, 완료 시 기쁨 반응으로 바뀌었다 돌아온다.

### M5. 알림과 PWA
- 매니페스트, 서비스 워커, 홈 화면 추가 안내(iOS 포함)
- 푸시 구독 저장, VAPID 키, 테스트 발송
- 일일 작업에서 다음 24시간 알림을 QStash 지연 메시지로 예약, `/api/jobs/notify`에서 발송: 기본 알림, 쉬는 날, 무반응 감쇠
- QStash 스케줄로 21:00 저녁 알림 (`/api/jobs/evening`)
- 알림 시간·쉬는 날 변경 시 예약 취소·재예약
- 알림 클릭 시 홈으로 이동, 반응 여부 기록

**완료 기준**: 안드로이드 크롬과 iOS(홈 화면에 추가한 상태)에서 설정한 시간 ±1분 안에 기본 알림을, 미처리 추천이 있는 날 21:00에 저녁 알림을 받는다. 알림이 없는 시간대에는 Neon 컴퓨트가 일시정지 상태로 유지된다.

### M6. AI로 미션 만들기
- `server/ai` 래퍼, 프롬프트, 출력 스키마
- 입력창 → 미리보기 카드(수정 가능) → 저장
- 하루 20회 제한, 첫 사용 시 외부 전송 안내

**완료 기준**: 기획서 15.1 예시 3개가 의도한 미션으로 변환된다. 스키마 검증 실패 시 수동 폼으로 넘어간다.

### M7. 출시 준비
- AI 생성 에셋으로 교체 (16.4 스타일 가이드, 검수 체크리스트)
- 개인정보처리방침·이용약관 페이지 (구글 OAuth 동의 화면 공개 전환에 필요)
- Sentry, 기본 사용 지표(가입, 일간 완료 수, 알림 반응률)
- 도메인 연결: taketoday.app (대표), taketoday.kr → 리다이렉트
- 핵심 흐름 Playwright 테스트(좁음·넓음 두 화면 폭), 모바일 실기기 QA(일반 폰, 플립, 폴드 접기·펼치기 전환, iOS)

**완료 기준**: 운영 도메인에서 가입부터 다음 날 정산까지 한 사이클이 문제없이 돈다.

### 병렬로 진행할 일
- **캐릭터 시트·말투 가이드**는 Design 캔버스에서 따로 진행한다(시기 미정). M4 전에 나오면 바로 쓰고, 늦어지면 임시 캐릭터로 진행한다.
- **에셋 제작**은 M1부터 따로 진행한다. 시점·스타일이 확정돼 있어 개발과 독립적이다. 개발은 임시 에셋으로 진행하고 M7에서 교체한다.
- **ADR·회고 기록**은 마일스톤마다 남긴다(9장).

## 7. 리스크와 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| iOS 푸시는 홈 화면에 추가한 PWA에서만 동작 | iOS 사용자 다수가 알림을 못 받을 수 있음 | 온보딩에 홈 화면 추가 안내, 알림 미설정 사용자에게 홈 배너 |
| Vercel Hobby cron 정확도 (하루 1회, ±59분) | 정산 시각 지연 | 지연 정산을 기본 경로로, cron은 백업 |
| Vercel Hobby는 개인·비상업 용도 기준 | 유료화 시 플랜 변경 필요 | 수익화 계획이 생기면 Pro 전환을 그때 결정 |
| Neon 무료 플랜은 5분 비활성 시 일시정지 | 첫 요청이 느려질 수 있음 | 초기에는 감수. 사용자가 늘면 유료 전환 검토 |
| Neon 무료 컴퓨트 한도(월 100 CU-hours) 소진 | 다음 주기까지 DB 중지 = 서비스 중단 | 주기적 DB 폴링 금지(2.1), CU-hours 주 1회 확인, 월 70% 초과 시 대응 |
| QStash 무료 한도(하루 1,000건) | 사용자 약 900명부터 알림 누락 | 사용자 수 모니터링, 근접 시 종량제 전환(10만 건당 $1) |
| 시간대 버그 (UTC와 KST 하루 경계) | 정산·추천·취소 판정 오류 | localDate 계산을 한 함수로만, 자정 경계 테스트 케이스 필수 |
| LLM 응답 품질·비용 | 엉뚱한 미션 생성, 비용 증가 | 미리보기 후 저장, 스키마 검증, 하루 20회 제한 |
| 폴더블 화면 전환 (접기·펼치기) | 레이아웃 깨짐, 입력 내용 유실 | CSS 기반 반응형, 폭 구간 3개, 실기기 전환 테스트 (2.3 ⑥) |
| 서비스 워커 캐시 문제 | 배포 후 옛 화면이 보임 | 버전별 캐시, 업데이트 감지 시 새로고침 안내 |

## 8. 확장 대비 체크리스트

기획서 12.1을 구현 항목으로 옮겼다. M1~M3 코드 리뷰 때 확인한다.

- [ ] mission_lists.owner_type 존재, 생성 시 `user` 고정
- [ ] missions의 담당 방식·담당자 컬럼 nullable로 존재
- [ ] completions.user_id는 "수행자"로만 사용
- [ ] wallet_transactions.reason에 `shared_reward` 정의
- [ ] 정산 함수가 "받을 사람 목록 + 금액"을 반환
- [ ] 리스트 접근 권한 확인이 `canAccessList()` 한 함수로 모여 있음
- [ ] 상한 카운트가 reason별로 분리
- [ ] room_placements에 좌표 컬럼(nullable) 존재 — 2단계 자유 배치 대비
- [ ] Auth.js에 provider 추가만으로 카카오·네이버 연결 가능

## 9. 기록 (커리어 목적)

이 프로젝트는 결과물과 함께 의사결정 과정을 보여주는 것이 목적이므로, 개발 중에도 기록을 남긴다.

- **ADR** (`docs/adr/NNN-제목.md`): 결정, 고려한 대안, 이유, 결과. 첫 후보: 폴더 구조(FSD 축소판 + server 분리), Next.js + Neon 선택, Drizzle 선택, shadcn/ui와 디자인 토큰 구조, 지연 정산 + cron 백업, 폴링 대신 지연 메시지 알림(무료 한도 보호), 도메인 로직 순수 함수 분리.
- **마일스톤 회고**: 마일스톤마다 계획과 실제의 차이, 바꾼 결정과 이유.
- **기획서 변경 이력**: 기획이 바뀌면 기획서 변경 이력에 같이 남긴다.
