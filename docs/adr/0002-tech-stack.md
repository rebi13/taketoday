# 0002. 기술 스택: Next.js + Neon + Drizzle + Auth.js, Vercel 배포

- 상태: 승인
- 날짜: 2026-10-28

## 배경
혼자 개발하는 사이드 프로젝트로, 화면과 API를 한 저장소에서 다루고 무료 플랜 안에서 운영하는 것이 목표다. 정산·상한처럼 트랜잭션과 집계가 중요한 규칙이 있다.

## 결정
| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js (App Router) + TypeScript |
| 호스팅 | Vercel Hobby |
| DB | Neon Postgres Free, DB 용도로만 사용 |
| ORM | Drizzle ORM + `@neondatabase/serverless` |
| 인증 | Auth.js (MVP는 Google, 이후 Kakao·Naver) |
| 예약 작업 | QStash + Vercel Cron (0004 참고) |

## 고려한 대안
| 대안 | 장점 | 단점 |
|---|---|---|
| Next.js + Supabase | DB·인증·예약 작업을 한곳에서 | 서비스 구조가 특정 플랫폼 기능에 묶임 |
| 프론트·백엔드 분리 (Vite + NestJS 등) | 경계가 명확 | 저장소·배포가 둘이 되어 혼자 운영하기 무거움 |
| ORM으로 Prisma | 생태계가 큼 | 서버리스에서 무겁고, 집계 쿼리는 SQL에 가까운 Drizzle이 다루기 쉬움 |

## 결과
- 기획서의 User·Account 분리 구조가 Auth.js 기본 모델과 같아, 카카오·네이버는 provider 추가만으로 붙는다.
- Neon Free는 5분 비활성 시 멈추고 월 100 CU-hours 한도가 있어, DB를 주기적으로 깨우는 작업을 금지한다(0004).
- Vercel Hobby는 비상업 용도 기준이다. 수익화를 결정하면 Pro 전환을 다시 본다.
