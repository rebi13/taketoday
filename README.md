# 오늘챙김

해야 할 생활 일을 오늘 할 만큼만 골라 챙겨주는 서비스. 미션을 완료하면 펫이 사는 방을 꾸밀 수 있다.

- 도메인: taketoday.app (예정)
- 상태: 기획 완료, M0(기반 세팅) 준비 중

## 문서

| 문서 | 내용 |
|---|---|
| [기획서](docs/plan.md) | 원칙, 기능, 정책, 재화·상점, 미션 라이브러리, 캐릭터, 데이터 모델 |
| [구현 계획](docs/implementation-plan.md) | 기술 스택, 예약 작업, 디자인 시스템 규칙, 폴더 구조, 마일스톤 |
| [화면 흐름](docs/screen-flow.md) | 화면·팝업 ID와 흐름도 |
| [커밋 규칙](docs/commit-convention.md) | 커밋 메시지 형식, type·scope, 커밋 단위 |
| [외부 서비스 연결](docs/setup.md) | Neon·Vercel·구글 로그인 계정 설정, 환경변수 |
| [ADR](docs/adr/) | 기술 결정 기록 |
| [시드 데이터](seed/) | 구역, 기본 미션 99개, 아이템 30종, 슬롯, 캐릭터 |

## 기술 스택

Next.js (App Router) · TypeScript · Neon Postgres · Drizzle ORM · Auth.js · Tailwind CSS · shadcn/ui · TanStack Query · Motion · QStash · Vercel
