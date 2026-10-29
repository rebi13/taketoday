# 오늘챙김 (taketoday)

반복되는데 자꾸 미루는 생활 관리를 5분짜리 미션으로 쪼개 매일 골라 알려주고, 완료하면 펫이 사는 방을 꾸밀 재화를 주는 PWA.

작업 전에 관련 문서를 먼저 읽는다.
- 무엇을 만드는지: `docs/plan.md` (기획서)
- 어떻게·어떤 순서로: `docs/implementation-plan.md` (스택, 구조, 마일스톤 M0~M7)
- 화면과 팝업의 흐름: `docs/screen-flow.md` (S/P/T/E/N ID 체계)
- 왜 그렇게 정했는지: `docs/adr/`
- 초기 데이터: `seed/`
- 외부 서비스(Neon·Vercel·구글 로그인) 설정과 환경변수: `docs/setup.md`

## 명령어

> 패키지 매니저는 pnpm. E2E와 마이그레이션 명령은 해당 도구를 붙일 때 추가한다.

| 목적 | 명령 |
|---|---|
| 개발 서버 | `pnpm dev` |
| 빌드 | `pnpm build` |
| 타입 체크 | `pnpm typecheck` |
| 린트 | `pnpm lint` |
| 포맷 | `pnpm format` (검사만: `pnpm format:check`) |
| 단위 테스트 | `pnpm test` |
| E2E | `pnpm test:e2e` (Playwright 도입 후) |
| 마이그레이션 생성 | `pnpm db:generate` (Drizzle 도입 후) |
| 시드 검증 | `pnpm seed:validate` |

작업을 마치면 타입 체크, 린트, 포맷 검사, 관련 테스트를 돌린다. 커밋 메시지는 `commit-msg` 훅(commitlint)이 검사한다. CI(`.github/workflows/ci.yml`)가 PR마다 같은 검사와 시드 검증·빌드를 다시 돌린다.

## 폴더 구조와 의존 규칙

```
src/app        라우팅·화면 조립만 (Next.js App Router)
src/widgets    화면의 큰 덩어리 (room-view, today-recommendations, tab-nav)
src/features   사용자 동작 하나 + 서버 호출 (complete-mission, purchase-item ...)
src/entities   데이터 하나를 보여주는 단위 (mission, item, character, wallet)
src/shared     도메인을 모르는 공통 코드 (ui = shadcn 원본, lib, config)
src/server     서버 전용: db, domain, services, ai, push, auth
```

- import는 `app → widgets → features → entities → shared` 방향으로만. 같은 층의 다른 슬라이스를 가져오지 않는다.
- 슬라이스는 `index.ts`로만 공개한다. 다른 슬라이스의 내부 파일을 직접 import하지 않는다.
- 화면 코드(Server Action, Route Handler 포함)는 `server/services`만 호출한다. 화면에서 DB나 `server/domain`을 직접 쓰지 않는다.
- `src/server/**` 파일은 `import "server-only"`로 시작한다.
- `server/domain`은 DB·네트워크를 모르는 순수 함수다. 같은 폴더에 `*.test.ts`를 둔다.
- `server/services`의 함수 하나 = 트랜잭션 하나. "읽기 → domain 함수 → 한 번에 쓰기" 순서를 지킨다.
- 위 import 규칙은 `eslint.config.mjs`의 `boundaries/dependencies`가 검사한다. 허용 목록 밖은 모두 막는다.
  - `server/services`는 `app`과 `features`(Server Action)에서만 부른다.
  - `server`는 `shared` 중 `lib`·`config`만 쓴다. `services`만 다른 server 슬라이스를 조합하고, 예외는 `auth → db`(Auth.js adapter) 하나다.
  - `shared/*` 안에서는 서로 가져올 수 있고 `index.ts` 제한도 없다(shadcn이 `shared/ui/button`처럼 파일 경로로 가져온다).

## 도메인 규칙 (바꾸면 서비스가 깨지는 것)

- **날짜**: "하루"는 항상 Asia/Seoul 기준 `localDate`(YYYY-MM-DD). `new Date()`로 날짜를 직접 자르지 말고 `shared/lib`의 날짜 함수 하나만 쓴다. 자정 경계 테스트를 반드시 둔다.
- **보상은 다음 날 정산**(ADR 0003). 완료 시에는 completion만 만들고 재화 거래를 만들지 않는다.
  - 정산: 취소 제외 → `completedAt` 순 → 미션별 첫 1건 → 앞에서 10건 × 10.
  - `daily_settlements`의 (user_id, local_date) 유니크로 한 번만 정산한다. 지연 정산(첫 요청 시)이 기본, cron은 백업.
- **취소**는 `completion.localDate == 오늘`일 때만. 삭제하지 않고 `canceledAt`을 채운다. 취소한 미션은 같은 날 다시 완료할 수 있다(새 completion). 정산이 미션별 1건만 인정한다.
- **완료 기준**(`checkCriteria`)은 "[도구·방법] + [범위] + [끝나는 동작] + 면 완료" 한 문장이다. 정도를 판단하는 상태 문장("보이지 않으면")은 쓰지 않고 행동이나 개수로 쓴다. 최소선으로 낮게(기획서 8.2). AI가 만드는 미션도 같은 규칙을 따른다.
- 화면에서는 완료 기준을 "이만큼 하면 완료"로 표시하고 "내 기준으로 바꾸기"를 함께 둔다. 사용자가 고친 기준은 `user_modified`로 표시해 기본 문장 변경에 덮어쓰지 않는다.
- **재화 잔액**은 `wallet_transactions` 합계. 저장된 값은 캐시일 뿐이다. 구매는 한 트랜잭션에서 잔액 확인 → 음수 거래 → 인벤토리 추가.
- **미션 삭제**는 소프트 삭제(`deletedAt`). 기록과 정산 이력이 참조한다.
- **탈퇴**: 즉시 `deactivated`(통계 제외), 30일 뒤 식별정보 파기. 통계 쿼리는 `active` 사용자만 집계한다.
- 금액·상한 상수는 `shared/config` 한 곳에만 둔다. 숫자를 코드에 흩뿌리지 않는다.

| 상수 | 값 |
|---|---|
| 미션 1회 보상 | 10 |
| 하루 개인 보상 상한 | 10회 |
| AI 미션 만들기 하루 사용 | 20회 |
| 기본 하루 추천 개수 | 2 |
| 저녁 알림 | 21:00 KST |

## 공유 리스트 확장 대비 (MVP에는 없지만 지킬 것)

- `mission_lists.owner_type`을 두고 MVP에서는 `user`만 만든다.
- 리스트 접근 확인은 `canAccessList()` 하나로만.
- 정산 함수는 "받을 사람 목록 + 금액"을 돌려준다.
- 상한은 거래 사유(`personal_reward`, `shared_reward`)별로 센다.

## 예약 작업

- DB를 주기적으로 깨우는 작업(폴링)을 만들지 않는다. Neon Free 컴퓨트 한도 때문이다(ADR 0004).
- `/api/jobs/daily`(Vercel Cron, 하루 1회), `/api/jobs/notify`(QStash 지연 메시지), `/api/jobs/evening`(QStash 21:00 스케줄).
- 모든 작업은 서명·비밀 헤더를 검증하고, 중복 실행돼도 결과가 같아야 한다.

## UI 규칙

- 색·둥글기·그림자·모션은 `src/app/globals.css`의 토큰만 쓴다. `bg-[#f2994a]` 같은 직접 값 금지.
- 여러 모양이 있는 컴포넌트는 `cva` 변형으로 정의한다. 새 모양은 변형을 추가하고, 쓰는 곳에서 클래스를 덧붙이지 않는다.
- 상태 이름은 DB 값과 같게 쓴다: `pending` / `done` / `postponed` / `canceled`.
- `shared/ui`(shadcn 원본)에는 도메인 단어를 넣지 않는다.
- 모바일 우선. 폭 구간: 600 미만 한 열, 600~839 카드 2열, 840 이상 두 영역 분할 + 왼쪽 세로 메뉴. 높이는 `100dvh`.
- 화면 크기를 JS 상태로 계산하지 않는다(폴드 접기·펼치기 대응). 레이아웃은 미디어 쿼리, 놓이는 자리에 따라 달라지는 컴포넌트는 컨테이너 쿼리.
- 방은 4:3 캔버스, 슬롯 위치는 `seed/room-slots.json`의 % 값.
- 버튼 높이 최소 44px. 모션은 보상·캐릭터에만, `prefers-reduced-motion`이면 끈다.
- 새 컴포넌트나 변형을 만들면 `/playground`에도 추가한다.
- 문구는 다그치지 않는다(기획서 원칙 3 "벌칙 없음"). 화면·팝업은 `docs/screen-flow.md`의 ID로 부른다.

## AI 기능

- LLM 호출은 `server/ai` 래퍼로만. 출력은 zod 스키마로 검증하고, 실패하면 1회 재시도 후 직접 입력으로 넘긴다.
- 사용자 식별 정보를 프롬프트에 넣지 않는다. 오늘 날짜(KST)는 넣는다.
- 결과는 바로 저장하지 않고 미리보기로 돌려준다.

## 문서와 커밋

- 기획이나 구조가 바뀌면 `docs/plan.md` 또는 `docs/implementation-plan.md`의 변경 이력에 한 줄 남긴다.
- 대안을 비교해서 고른 기술 결정은 `docs/adr/`에 새 ADR로 남긴다.
- 커밋 메시지는 `docs/commit-convention.md`를 따른다. Conventional Commits 형식, 설명은 한국어, scope는 문서의 목록에서 고른다. 예: `feat(missions): 기한형 미션 추가`
- 시드 데이터를 바꾸면 `pnpm seed:validate`를 통과시킨다.
