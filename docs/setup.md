# 외부 서비스 연결 가이드 (M0 5~7단계)

> 2026-10-29
> Neon(DB), Vercel(배포), 구글 로그인을 연결하기 위해 **계정에서 직접 할 일**과 **받아 올 값**을 정리한다. 코드 작업(Drizzle 설정, Auth.js 설정)은 이 값이 준비된 뒤 진행한다.
> 확인한 문서: Neon(요금제·리전·서버리스 드라이버·Vercel 연동), Auth.js v5(설치·배포·Google provider), Vercel(함수 리전). 화면 메뉴 이름은 바뀔 수 있으니 다르면 비슷한 이름을 찾는다.

## 한눈에 보기

| 순서 | 할 일 | 받아 올 값 | 걸리는 것 |
|---|---|---|---|
| 1 | [Neon 프로젝트 만들기](#1-neon) | `DATABASE_URL`, `DATABASE_URL_UNPOOLED` (브랜치 2개분) | 없음 |
| 2 | [Vercel에 저장소 연결](#2-vercel) | 고정 배포 주소 (예: `https://taketoday.vercel.app`) | 없음 |
| 3 | [구글 OAuth 클라이언트 만들기](#3-구글-로그인) | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | 2번의 고정 주소 |
| 4 | [환경변수 넣기](#4-환경변수-넣기) | — | 1~3번 값 |

구현 계획의 순서(5 Neon → 6 로그인 → 7 Vercel)와 달리 **Vercel을 로그인보다 먼저** 연결한다. 구글에 등록할 리디렉션 주소에 Vercel 고정 주소가 들어가기 때문이다.

## 정해 둔 것

| 항목 | 결정 | 이유 |
|---|---|---|
| 리전 | Neon `aws-ap-southeast-1`(싱가포르), Vercel 함수 `sin1`(싱가포르) | Neon에는 서울·도쿄 리전이 없다. Vercel에는 서울(`icn1`)이 있지만, 요청 하나가 DB 쿼리를 여러 번 하므로 함수를 DB 옆에 두는 편이 빠르다. 함수 기본값은 미국 동부(`iad1`)라 그대로 두면 쿼리마다 태평양을 왕복한다. 함수 리전은 저장소의 `vercel.json`으로 고정했다 |
| Neon 브랜치 | `main`(운영) + `dev`(프리뷰·로컬) 2개 | Free 플랜은 프로젝트당 브랜치 10개, 컴퓨트 월 100 CU-hours를 모든 브랜치가 나눠 쓴다. 프리뷰마다 브랜치를 만드는 자동 연동은 브랜치가 쌓이고 정리 설정이 필요해 처음에는 쓰지 않는다 |
| DB 연결 | 앱은 `DATABASE_URL`(풀링), 마이그레이션은 `DATABASE_URL_UNPOOLED`(직접 연결) | Neon·Vercel 연동이 쓰는 이름과 같게 맞춰, 나중에 자동 연동으로 바꿔도 코드를 고치지 않는다 |
| DB 드라이버 | `@neondatabase/serverless`의 WebSocket(`Pool`) + `drizzle-orm/neon-serverless` | 서비스 함수 하나 = 트랜잭션 하나 규칙(CLAUDE.md)에 여러 단계 트랜잭션이 필요하다. HTTP 방식은 여러 단계 트랜잭션을 지원하지 않는다 |
| 인증 | Auth.js v5 (`next-auth@5` 베타) + `@auth/drizzle-adapter` | ADR 0002. v5는 2026-10 현재 아직 베타(`5.0.0-beta.32`)이고 안정판은 v4다. Drizzle adapter와 `AUTH_*` 환경변수 자동 인식이 v5 기준이라 v5로 간다 |
| 프리뷰 로그인 | Auth.js 리디렉션 프록시 (`AUTH_REDIRECT_PROXY_URL`) | 프리뷰 주소는 배포마다 바뀌는데 구글은 와일드카드 주소를 받지 않는다. 고정 주소 하나를 구글에 등록하고, 그 주소가 프리뷰로 돌려보낸다 |

## 1. Neon

1. [Neon 콘솔](https://console.neon.tech)에서 새 프로젝트를 만든다.
   - 이름: `taketoday`
   - Postgres 버전: 기본값(최신)
   - 리전: **AWS Asia Pacific (Singapore)** `aws-ap-southeast-1`. 리전은 나중에 바꿀 수 없다.
2. 기본 브랜치 이름이 `main`인지 확인한다(운영용).
3. **Branches**에서 `main`을 부모로 `dev` 브랜치를 만든다(프리뷰·로컬용).
4. 브랜치마다 **Connect**에서 연결 문자열 두 개를 복사한다.

| 값 | Connect 화면 설정 | 쓰는 곳 |
|---|---|---|
| `DATABASE_URL` | Connection pooling **켬** (호스트에 `-pooler`가 붙음) | 앱 실행 |
| `DATABASE_URL_UNPOOLED` | Connection pooling **끔** | `drizzle-kit` 마이그레이션 |

→ 받아 올 값: `main`용 2개, `dev`용 2개, 총 4개. 비밀번호가 들어 있으니 메신저나 이슈에 붙이지 않는다.

**Free 플랜 한도** (Neon 문서 기준)

| 항목 | 한도 | 이 프로젝트에서 |
|---|---|---|
| 컴퓨트 | 프로젝트당 월 100 CU-hours (0.25 CU로 400시간) | 모든 브랜치 합산. DB를 주기적으로 깨우는 작업 금지(ADR 0004) |
| 브랜치 | 프로젝트당 10개 | 2개 사용 |
| 저장 공간 | 프로젝트당 1 GB | |
| 자동 정지 | 5분 비활성 시 정지, 끌 수 없음 | 정지 후 첫 요청이 느릴 수 있음 |

## 2. Vercel

1. [Vercel](https://vercel.com/new)에서 **Import Git Repository** → `rebi13/taketoday`를 고른다.
2. 설정
   - Framework: Next.js (자동 인식)
   - Install Command: 기본값. `packageManager`(pnpm 12)를 따른다
   - Build Command: 기본값(`next build`). DB 마이그레이션을 빌드에 넣을지는 5단계 코드 작업에서 정한다
   - 환경변수: 지금은 비워 둔다. 4번에서 넣는다
3. 첫 배포가 끝나면 **Settings → Domains**에서 고정 주소를 확인한다. 보통 `https://<프로젝트 이름>.vercel.app`이다.
   → 받아 올 값: 고정 주소. 이후 `taketoday.app`을 연결하면(M7) 4번의 `AUTH_REDIRECT_PROXY_URL`과 구글 리디렉션 주소를 새 도메인으로 바꾼다.
4. **Settings → Functions → Function Region**이 `sin1`(Singapore)로 보이는지 확인한다. 저장소의 `vercel.json`이 정하므로 화면에서 바꿀 필요는 없다.
5. **Settings → Git**에서 `main` 브랜치가 Production Branch인지 확인한다. PR 브랜치는 프리뷰로 배포된다.

## 3. 구글 로그인

[Google Cloud 콘솔](https://console.cloud.google.com)에서 진행한다.

1. 새 프로젝트를 만든다: `taketoday`
2. **Google Auth Platform**(이전 이름: OAuth 동의 화면)을 설정한다.
   - 앱 이름: 오늘챙김
   - 사용자 지원 이메일·개발자 연락처: 본인 이메일
   - 대상(Audience): **외부(External)**
   - 게시 상태: **테스트(Testing)**로 둔다. 테스트 사용자로 등록한 구글 계정만 로그인할 수 있다(최대 100명). 본인 계정을 테스트 사용자로 추가한다.
   - 범위(Scopes): 추가하지 않는다. Auth.js 기본값(`openid`, `email`, `profile`)은 민감하지 않은 범위라 구글 검수가 필요 없다.
3. **클라이언트(Clients) → 클라이언트 만들기**
   - 애플리케이션 유형: **웹 애플리케이션**
   - 승인된 리디렉션 URI 두 개를 등록한다

     ```
     http://localhost:3000/api/auth/callback/google
     https://<2번의 고정 주소>/api/auth/callback/google
     ```

   - 프리뷰 주소는 등록하지 않는다. 프리뷰 로그인은 고정 주소를 거쳐 돌아온다(아래 4번 `AUTH_REDIRECT_PROXY_URL`).
4. 만들어진 **클라이언트 ID**와 **클라이언트 보안 비밀번호**를 복사한다.
   → 받아 올 값: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`

**공개 전환은 M7에서**: 테스트 사용자 외에도 열려면 게시 상태를 "프로덕션"으로 바꿔야 하고, 개인정보처리방침·이용약관 페이지 주소가 필요하다(구현 계획 M7).

## 4. 환경변수 넣기

### `AUTH_SECRET` 만들기

로그인 토큰 암호화에 쓰는 임의 문자열이다. 아래 명령으로 만든다.

```bash
pnpm dlx auth secret
```

`openssl rand -base64 33`으로 만들어도 된다(32자 이상).

- **운영(Production)과 프리뷰(Preview)는 같은 값**을 쓴다. 리디렉션 프록시가 이 값으로 프리뷰 요청을 검증한다.
- 로컬은 다른 값을 써도 된다.

### Vercel (Settings → Environment Variables)

| 이름 | Production | Preview | 비고 |
|---|---|---|---|
| `DATABASE_URL` | Neon `main` 풀링 | Neon `dev` 풀링 | |
| `DATABASE_URL_UNPOOLED` | Neon `main` 직접 | Neon `dev` 직접 | 빌드에서 마이그레이션할 때만 필요 |
| `AUTH_SECRET` | 값 A | **값 A (같게)** | |
| `AUTH_GOOGLE_ID` | 구글 클라이언트 ID | 같음 | |
| `AUTH_GOOGLE_SECRET` | 구글 클라이언트 보안 비밀번호 | 같음 | |
| `AUTH_REDIRECT_PROXY_URL` | `https://<고정 주소>/api/auth` | **같음** | 두 환경 모두에 넣어야 프록시가 켜진다 |

`AUTH_URL`, `AUTH_TRUST_HOST`는 넣지 않는다. Vercel에서는 Auth.js가 자동으로 알아낸다.

### 로컬 (`.env.local`)

저장소의 `.env.example`을 복사해 채운다. `.env.local`은 git에 올라가지 않는다.

```bash
cp .env.example .env.local
```

로컬은 Neon `dev` 브랜치를 쓰고, `AUTH_REDIRECT_PROXY_URL`은 비워 둔다.

## 다 하고 나서 알려 줄 것

값 자체는 채팅에 붙이지 않는다. 아래만 알려 주면 코드 작업을 이어 간다.

- [ ] Neon 프로젝트·`dev` 브랜치 생성, 로컬 `.env.local`에 DB 값 입력 완료
- [ ] Vercel 고정 주소: `https://...`
- [ ] 구글 OAuth 클라이언트 생성, 로컬 `.env.local`에 `AUTH_*` 입력 완료
- [ ] Vercel 환경변수 입력 완료

## 이후 코드 작업 (값이 준비되면)

| 작업 | 내용 |
|---|---|
| 환경변수 검증 | `shared/config`에서 zod로 검증. CI와 빌드에는 실제 비밀값이 없으므로 CI용 더미 값을 둔다 |
| Drizzle | `server/db`에 스키마·클라이언트(WebSocket `Pool`), `drizzle.config.ts`, `pnpm db:generate`·`db:migrate`. 운영 마이그레이션은 배포 파이프라인에서만(구현 계획 4장) |
| Auth.js | `server/auth`에 설정과 Drizzle adapter, `app/api/auth/[...nextauth]` 라우트, 로그인 필요한 화면 보호 |
| 확인 | 프리뷰 배포에서 구글 로그인 후 빈 홈이 보인다(M0 완료 기준) |

## 나중에 추가되는 환경변수

M5(알림)에서 추가한다. 지금은 만들 필요 없다.

| 이름 | 용도 |
|---|---|
| `CRON_SECRET` | `/api/jobs/daily` (Vercel Cron) 요청 검증 |
| `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` | 알림 예약과 `/api/jobs/notify`·`/api/jobs/evening` 서명 검증 |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | 웹 푸시 |
