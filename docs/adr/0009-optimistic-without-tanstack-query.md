# 0009. 낙관적 업데이트는 TanStack Query 없이 useOptimistic + Server Action으로

- 상태: 승인
- 날짜: 2026-11-03

## 배경
홈(S10)의 완료·내일로는 누르자마자 카드가 바뀌어야 한다(서버 응답을 기다리면 알림에서 들어와 한 번 누르는 흐름이 굼떠 보인다). 구현 계획 2장의 스택 표는 서버 상태에 TanStack Query를 적어 두었지만, #20에서 도입 여부를 정하기로 했다. 그사이 M1에서 켜기·끄기(S11)를 React 19 `useOptimistic` + Server Action + `refresh()`로 이미 만들었다.

## 결정
TanStack Query를 들이지 않는다. 화면 데이터는 서버 컴포넌트가 `server/services`에서 읽고, 바꾸는 동작은 Server Action이 서비스를 부른 뒤 `refresh()`로 다시 그린다. 낙관적 표시는 목록을 쥔 컴포넌트의 `useOptimistic`으로 하고, 서버가 다시 그린 값이 오면 그것으로 맞춘다.

## 고려한 대안
| 대안 | 장점 | 단점 |
|---|---|---|
| useOptimistic + Server Action (선택) | 추가 의존성 없음. 서버 컴포넌트가 읽은 값이 곧 화면 상태라 캐시가 둘로 갈리지 않음. 이미 S11에서 쓰는 방식 | 재시도·백그라운드 다시 읽기 같은 기능은 직접 만든다. 실패하면 refresh 값으로 되돌아가는 것뿐이라 오류 안내는 토스트로 따로 한다 |
| TanStack Query | 캐시·재시도·포커스 시 다시 읽기·낙관적 갱신 패턴이 갖춰져 있음 | 읽기를 클라이언트 fetch(Route Handler)로 옮기거나 서버 컴포넌트 값과 캐시를 이중으로 맞춰야 함. cacheComponents·PPR로 미리 그린 화면의 장점이 줄고, 번들이 커짐 |

## 결과
- 화면 코드는 "서버 컴포넌트가 읽고, Server Action이 바꾸고, refresh로 다시 그린다" 한 가지 길만 쓴다.
- 오프라인 완료 큐(M5 서비스 워커)나 여러 화면이 같은 데이터를 자주 다시 읽어야 할 때 다시 본다. 그때 TanStack Query를 들이면 이 ADR을 대체한다.
