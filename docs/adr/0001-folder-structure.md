# 0001. 폴더 구조: FSD 축소판 + server 분리

- 상태: 승인
- 날짜: 2026-10-28

## 배경
화면 수가 24개, 팝업이 24개로 적지 않고, 정산·추천 같은 서버 규칙이 서비스의 핵심이다. 화면 코드와 서버 규칙이 섞이면 규칙을 테스트하기 어렵고, 디자인을 바꿀 때 영향 범위를 가늠하기 어렵다.

## 결정
화면 쪽은 `app → widgets → features → entities → shared` 층을 둔 FSD(Feature-Sliced Design) 축소판으로, 서버 쪽은 `src/server/`(db, domain, services, ai, push, auth)로 분리한다.
- FSD의 `pages` 층은 두지 않는다. Next.js `app/`이 라우팅과 화면 조립을 맡는다.
- import는 위에서 아래로만, 같은 층끼리는 금지. ESLint로 강제한다.
- 화면은 `server/services`만 호출하고, `server/`에는 `import 'server-only'`를 넣는다.
- `server/domain`은 DB를 모르는 순수 함수로 둔다.

## 고려한 대안
| 대안 | 장점 | 단점 |
|---|---|---|
| Next.js 기본 구조 (`components/`, `lib/`) | 익숙하고 단순 | 화면이 늘면 경계가 흐려지고 의존 방향을 강제할 수 없음 |
| FSD 전체 (pages 포함) | 규칙이 명확 | Next.js `app/`과 역할이 겹쳐 폴더가 이중으로 생김 |
| **FSD 축소판 + server 분리** | 층 규칙은 유지하면서 Next.js와 충돌 없음, 서버 규칙을 순수 함수로 테스트 | 처음에 층을 정하는 판단이 필요 |

## 결과
- 넓은 화면(폴드 펼침)에서 홈을 두 영역으로 나눌 때 `widgets/room-view`, `widgets/today-recommendations`를 그대로 옮겨 붙일 수 있다.
- 정산·추천·상한 규칙은 DB 없이 Vitest로 검증한다.
- 층 판단이 애매한 컴포넌트가 생기면 이 ADR에 예시를 추가한다.
