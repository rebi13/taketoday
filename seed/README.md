# seed

서비스가 처음부터 제공하는 데이터입니다. 기획서(`docs/plan.md`) 8장·9장·16장 표에서 만들었습니다.
값을 바꿀 때는 기획서와 이 파일을 함께 고칩니다.

| 파일 | 내용 | 수량 |
|---|---|---|
| `zones.json` | 구역. 아이콘은 lucide-react 이름 | 14 |
| `missions.json` | 기본 미션 라이브러리 | 99 |
| `items.json` | 상점 아이템 27 + 시작 선물 3 | 30 |
| `item-sets.json` | 세트 테마 | 3 |
| `room-slots.json` | 방 슬롯 10개와 위치(4:3 캔버스 대비 %) | 10 |
| `characters.json` | 캐릭터 3종, 반응 7종, 대기 움직임 규칙 | 3 |
| `schema.ts` | zod 스키마 | |
| `validate.ts` | 검증 스크립트 (`npx tsx seed/validate.ts`) | |

## 필드 메모

- `missions.json`
  - `id`: `구역-번호` (예: `desk-01`). 한 번 정한 id는 바꾸지 않습니다. 사용자 미션이 `templateId`로 참조합니다.
  - `difficulty`: `low` / `mid` / `high` = 하 / 중 / 상
  - `conditionTags`: 해당하는 사람만 켜는 조건. `pet`, `plant`, `car`, `aircon`, `humidifier`
  - `seasons`: 비어 있으면 계절 무관. 값이 있으면 그 계절에만 추천 후보
  - `defaultOn`: 온보딩에서 처음부터 켬. 조건 구역의 미션은 해당 조건을 고른 경우에만 켭니다
  - `shareable`: 2단계 공유 리스트 템플릿 후보
- `items.json`
  - `slotType`: `wall_deco`·`floor_deco`는 각각 슬롯 두 칸(`_1`, `_2`)에 놓을 수 있습니다
  - `costumeAnchor`: 캐릭터 꾸미기가 붙는 기준점 `head` / `body` / `paws`
  - `asset`: 에셋을 만들기 전에는 `null`. 만들면 `public/` 아래 경로
- `room-slots.json`의 위치값은 1차안입니다. 디자인 시안이 나오면 맞춰 조정합니다.

## 금액·상한 상수

시드가 아니라 코드 상수(`src/shared/config`)로 둡니다. 기준값은 기획서 7장입니다.

| 이름 | 값 |
|---|---|
| 미션 1회 보상 | 10 |
| 하루 개인 보상 상한 | 10회 |
| 하루 공유 보상 상한 (2단계) | 3회 |
| 공유 완료자 가중치 (2단계) | 1.5배 |
| AI 미션 만들기 하루 사용 | 20회 |
| 기본 하루 추천 개수 | 2 |
| 저녁 알림 | 21:00 KST |
