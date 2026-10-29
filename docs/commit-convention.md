# 커밋 규칙

> 2026-10-29
> [Conventional Commits 1.0](https://www.conventionalcommits.org/ko/v1.0.0/)을 따른다. 설명과 본문은 한국어로 쓴다. M0에서 commitlint로 검사를 붙인다(`commitlint.config.mjs`).

## 1. 형식

```
<type>(<scope>): <제목>

<본문: 무엇이 왜 바뀌었는지>

<꼬리말>
```

예:

```
fix(settlement): 취소 후 다시 완료한 미션을 한 번만 보상

같은 날 취소하고 다시 완료하면 completion이 2건 생긴다. 정산이 취소된
건만 빼고 나머지를 모두 세어 같은 미션에 20을 주고 있었다.
미션별 첫 1건만 인정하도록 settleDay의 중복 제거를 취소 제외 뒤로 옮겼다.
```

## 2. type

| type | 쓰는 때 |
|---|---|
| `feat` | 사용자가 알아챌 수 있는 기능 추가·변경 |
| `fix` | 버그 수정 |
| `refactor` | 동작 의도는 같고 구조를 바꿈 |
| `perf` | 성능 개선 |
| `test` | 테스트만 추가·수정 |
| `docs` | 문서만 (`docs/`, `README.md`, `CLAUDE.md`) |
| `style` | 포맷, 세미콜론 등 의미 없는 변경. 화면 스타일 변경은 `feat`/`fix` |
| `build` | 빌드 설정, 의존성 (`package.json`, `next.config`) |
| `ci` | GitHub Actions, Vercel 설정 |
| `chore` | 위 어디에도 속하지 않는 잡일 (설정 파일 정리 등) |
| `revert` | 이전 커밋 되돌리기 |

## 3. scope

바뀐 도메인 영역을 쓴다. 폴더 이름이 아니라 "무엇에 대한 변경인가"로 고른다. 여러 영역에 걸쳐 하나로 고를 수 없으면 생략한다.

| scope | 영역 |
|---|---|
| `missions` | 미션 목록·생성·수정·삭제, 완료 기준, 주기 |
| `recommendations` | 오늘의 추천, 내일로 |
| `completions` | 완료·취소, 날짜별 기록 |
| `settlement` | 다음 날 정산, 보상 상한 |
| `wallet` | 재화 잔액, 거래 |
| `shop` | 상점, 구매, 인벤토리 |
| `room` | 방, 슬롯 배치 |
| `character` | 캐릭터 SVG, 움직임, 반응 |
| `onboarding` | 온보딩 |
| `notifications` | 푸시, 알림 예약, 저녁 알림 |
| `pwa` | 매니페스트, 서비스 워커 |
| `ai` | AI로 미션 만들기 |
| `auth` | 로그인, 세션, 탈퇴 |
| `jobs` | 예약 작업 (`/api/jobs/*`) |
| `db` | 스키마, 마이그레이션 |
| `seed` | 시드 데이터 |
| `ui` | 디자인 토큰, `shared/ui`, `/playground` |
| `layout` | 탭바, 반응형 레이아웃 |
| `adr` | ADR 문서 |
| `deps` | 의존성 갱신 |

목록에 없는 영역이 생기면 이 표와 `commitlint.config.mjs`의 `scope-enum`을 같은 커밋에서 함께 고친다.

## 4. 제목

- 한국어로, 바뀐 결과를 짧게 쓴다. "~한다", "~함"이 아니라 명사형·동사 원형으로 끝낸다.
  - 좋음: `feat(missions): 기한형 미션 추가`
  - 나쁨: `feat(missions): 기한형 미션을 추가했습니다.`
- 끝에 마침표를 찍지 않는다.
- type·scope 포함 72자 이내.
- 화면·팝업은 `docs/screen-flow.md`의 ID로 부를 수 있다. 예: `feat(missions): P25 내 기준으로 바꾸기 팝업`

## 5. 본문

- 무엇이 왜 바뀌었는지 쓴다. 어떻게는 코드가 보여 준다.
- 제목만으로 이유가 분명한 작은 변경은 본문을 생략해도 된다.
- 도메인 규칙(날짜, 정산, 취소, 잔액)을 건드리는 커밋은 반드시 본문에 이유를 쓴다.
- 대안을 비교해 고른 결정이면 본문에 ADR 번호를 적는다. 예: `ADR 0003 참고`
- 한 줄은 72자 안팎에서 줄바꿈한다.

## 6. 꼬리말

- 호환을 깨는 변경(DB 컬럼 삭제·이름 변경, API 응답 형태 변경)은 type 뒤에 `!`를 붙이고 꼬리말에 `BREAKING CHANGE: <내용>`을 쓴다.
  ```
  feat(db)!: completions.status 컬럼을 canceledAt으로 대체

  BREAKING CHANGE: status 컬럼을 지웠다. 마이그레이션 0007 적용 전 배포 금지.
  ```
- AI 에이전트가 만든 커밋은 `Co-Authored-By:` 줄을 붙인다.
- 이슈·PR 번호는 커밋에 쓰지 않는다. PR 본문에서 이슈를 연결한다.

## 7. 넣지 않는 것

제목과 본문 어디에도 진행 단위 표시를 넣지 않는다. 시간이 지나면 의미가 없고 내용과 어긋난다.

- 안 됨: `M2`, `Phase 3`, `round 2`, `PR #12`, `issue #8`, `리뷰 반영`, `WIP`
- 대신: 무엇을 왜 바꿨는지를 쓴다. 마일스톤·리뷰 라운드 정보는 PR 본문에 쓴다.

## 8. 커밋 단위

- 커밋 하나 = 논리적 변경 하나. 되돌릴 때 함께 되돌려야 하는 것만 묶는다.
- 커밋마다 타입 체크·린트·테스트가 통과하는 상태로 둔다.
- 함께 묶어야 하는 것:
  - 스키마 변경과 그 마이그레이션 파일 (`pnpm db:generate` 결과)
  - 기획·구조 변경과 `docs/plan.md`·`docs/implementation-plan.md` 변경 이력 한 줄
  - 시드 변경과 `npx tsx seed/validate.ts` 통과
  - 새 컴포넌트·변형과 `/playground` 추가
  - 도메인 함수 변경과 같은 폴더의 `*.test.ts`
- 파일 이름을 지정해 스테이징한다. `git add .`, `git add -A`는 쓰지 않는다.
- 이미 만든 커밋을 `--amend`로 덮어쓰지 않는다. 고칠 것이 있으면 새 커밋을 만든다.
- 커밋 훅이 실패하면 원인을 고치고 새 커밋을 만든다. `--no-verify`로 건너뛰지 않는다.
