# 화면 흐름

> 2026-10-29 확정. 그림으로 보는 버전: Claude 아티팩트 「오늘챙김 화면 흐름」
> 관련 문서: [기획서](plan.md) 10장 화면 구성 · [구현 계획](implementation-plan.md) 2.3장 반응형

## 표기

| 접두 | 뜻 | 도면 모양 |
|---|---|---|
| S | 화면(페이지) | 사각형 |
| P | 팝업(다이얼로그·바텀시트·전체 화면 연출) | 둥근 캡슐 |
| T | 토스트·배너 | 깃발 |
| E | 빈 상태 | 평행사변형 |
| N | 푸시 알림 | 육각형 |
| ①~⑨ | 세부 선택 (주황 점선) | |

## 세부 선택 ①~⑨

화면을 따로 둘지 합칠지 같은 선택이다. 구현하면서 추천안을 기본으로 하고, 바꾸면 이 표를 고친다.

| 번호 | 대상 | 선택지 | 기본(추천) |
|---|---|---|---|
| ① | S03 환영 소개 | 넣기 / 빼기 | 빼고 S04에 한 줄 소개 |
| ② | S06 켜질 미션 확인 | 따로 / S05에 합치기 | S05에 합치기 |
| ③ | S08 홈 화면 추가·알림 허용 | 온보딩 중 / 첫 완료 직후 | 첫 완료 직후 |
| ④ | 탭 구성 | 5개 / 설정을 홈 상단으로 빼고 4개 | 4개 |
| ⑤ | S15 기본 미션 둘러보기 | 별도 화면 / S11 안의 탭 | S11 탭 |
| ⑥ | S17 날짜별 상세 | 별도 화면 / S16에서 펼치기 | 펼치기 |
| ⑦ | P02 완료 연출 | 팝업 / 카드 위 짧은 애니메이션 + 토스트 | 가볍게 |
| ⑧ | P12 잔액 부족 | 팝업 / P10 안 비활성 버튼 + 안내 | 비활성 버튼 |
| ⑨ | P13 구매 직후 | 바로 놓을지 묻기 / 상점에 머물기 | 묻기 |

## 1. 진입과 온보딩

앱을 열었을 때 로그인 여부, 첫 가입 여부, 전날 정산 결과에 따라 갈린다. 로그인은 소셜 로그인만 쓰고 MVP는 구글 하나다. iOS는 홈 화면에 추가해야 푸시를 받을 수 있어서 P20이 알림 허용보다 먼저다.

```mermaid
flowchart TD
  N01{{"N01 기본 알림"}}:::push --> start
  start(["앱 열기"]):::q --> auth{"로그인<br>상태?"}:::q
  auth -- "로그인 안 됨" --> S01["S01 랜딩"]:::screen
  S01 -- "소셜 로그인<br>MVP는 구글" --> isnew{"처음<br>가입?"}:::q
  isnew -- "예" --> S02["S02 약관 동의<br>만 14세 이상 확인"]:::screen
  S02 --> S03["S03 환영 소개 ①"]:::dS
  S03 --> S04["S04 캐릭터 고르기<br>이름 짓기"]:::screen
  S04 --> S05["S05 생활 정보<br>거주 형태 · 조건 태그"]:::screen
  S05 --> S06["S06 켜질 미션 확인 ②"]:::dS
  S06 --> S07["S07 알림 시간<br>쉬는 날"]:::screen
  S07 --> S08["S08 홈 화면 추가 ·<br>알림 허용 ③"]:::dS
  S08 -- "iOS, 홈 화면<br>추가 전" --> P20(["P20 홈 화면<br>추가 방법"]):::pop
  S08 -- "알림 켜기" --> P18(["P18 알림 허용<br>사전 안내"]):::pop
  P18 --> perm{"브라우저<br>권한"}:::q
  perm -- "거부" --> P19(["P19 알림 거부 안내"]):::pop
  perm -- "허용" --> S09
  P19 --> S09
  P20 -. "나중에" .-> S09
  S08 -. "건너뛰기" .-> S09
  S09["S09 시작 선물 받기<br>침대 · 러그 · 스탠드"]:::screen --> S10
  auth -- "로그인 됨" --> settle{"정산된<br>어제 보상?"}:::q
  isnew -- "아니오" --> settle
  settle -- "있음" --> P09(["P09 어제 보상 도착"]):::pop --> S10
  settle -- "없음" --> S10["S10 홈"]:::screen

classDef screen fill:#ffffff,stroke:#8b8174,stroke-width:1.5px,color:#2b2823
classDef pop fill:#e6eff7,stroke:#5f87a8,stroke-width:1.5px,color:#1f3446
classDef toast fill:#fbf0d2,stroke:#c29a2e,stroke-width:1.5px,color:#4a3a0c
classDef push fill:#f7e1d4,stroke:#c07a50,stroke-width:1.5px,color:#4c2a17
classDef empty fill:#eeece7,stroke:#9b968c,stroke-width:1.5px,color:#3d3a34
classDef q fill:#faf7f2,stroke:#b3aa9c,stroke-width:1.2px,color:#4a463f
classDef sys fill:#e9e6f2,stroke:#7c74a6,stroke-width:1.5px,color:#2c2747
classDef dS fill:#ffffff,stroke:#e0742a,stroke-width:2.5px,stroke-dasharray:7 4,color:#2b2823
classDef dP fill:#e6eff7,stroke:#e0742a,stroke-width:2.5px,stroke-dasharray:7 4,color:#1f3446
```

## 2. 탭 구조

넓은 화면(840px 이상, 폴드 펼침)에서는 하단 탭바 대신 왼쪽 세로 메뉴를 쓴다.

```mermaid
flowchart TD
  TAB["탭바 ④<br>좁은 화면: 하단 · 넓은 화면: 왼쪽 세로 메뉴"]:::dS
  TAB --> S10["홈<br>S10"]:::screen
  TAB --> S11["미션<br>S11"]:::screen
  TAB --> S16["기록<br>S16"]:::screen
  TAB --> S18["방<br>S18"]:::screen
  TAB --> S20["설정<br>S20"]:::screen
  S10 -. "방 영역 누르기" .-> S18
  S11 --> S12["S12 미션 상세"]:::screen
  S11 --> S13["S13 직접 만들기"]:::screen
  S11 --> S14["S14 AI로 만들기"]:::screen
  S11 --> S15["S15 기본 미션<br>둘러보기 ⑤"]:::dS
  S16 --> S17["S17 날짜별 상세 ⑥"]:::dS
  S18 --> S19["S19 상점"]:::screen
  S20 --> S21["S21 회원 탈퇴"]:::screen
  S20 --> S22["S22 약관 ·<br>개인정보처리방침"]:::screen

classDef screen fill:#ffffff,stroke:#8b8174,stroke-width:1.5px,color:#2b2823
classDef pop fill:#e6eff7,stroke:#5f87a8,stroke-width:1.5px,color:#1f3446
classDef toast fill:#fbf0d2,stroke:#c29a2e,stroke-width:1.5px,color:#4a3a0c
classDef push fill:#f7e1d4,stroke:#c07a50,stroke-width:1.5px,color:#4c2a17
classDef empty fill:#eeece7,stroke:#9b968c,stroke-width:1.5px,color:#3d3a34
classDef q fill:#faf7f2,stroke:#b3aa9c,stroke-width:1.2px,color:#4a463f
classDef sys fill:#e9e6f2,stroke:#7c74a6,stroke-width:1.5px,color:#2c2747
classDef dS fill:#ffffff,stroke:#e0742a,stroke-width:2.5px,stroke-dasharray:7 4,color:#2b2823
classDef dP fill:#e6eff7,stroke:#e0742a,stroke-width:2.5px,stroke-dasharray:7 4,color:#1f3446
```

## 3. 하루 흐름 (홈에서 미션 수행)

알림으로 들어와 완료하고, 자정에 정산된 보상을 다음 날 받는다. 21:00에는 아직 처리하지 않은 추천이 있을 때만 저녁 알림(N02)을 보낸다. 홈에서의 취소는 T01 되돌리기로, 확인 팝업 P04는 기록 화면에서만 쓴다. 취소한 미션은 같은 날 카드의 "다시 완료" 버튼으로 다시 완료할 수 있다.

```mermaid
flowchart TD
  N01{{"N01 기본 알림<br>어제 보상 + 오늘 추천 2개"}}:::push --> S10
  N02{{"N02 저녁 알림 21:00<br>미처리 추천이 있을 때"}}:::push --> S10
  S10["S10 홈<br>방 · 오늘의 추천 · 적립 예정 n/10"]:::screen
  S10 -. "마감 지난<br>기한형 미션" .-> P07(["P07 기한 지난 미션<br>계속 · 끝내기 · 삭제"]):::pop
  S10 -- "추천이 없을 때" --> E01[/"E01 오늘 추천 없음<br>미션 목록으로"/]:::empty
  S10 -- "카드 누르기" --> P01(["P01 완료 기준 보기<br>이만큼 하면 완료"]):::pop
  S10 -- "완료" --> dup{"오늘 이미<br>적립 예정?"}:::q
  P01 -- "완료" --> dup
  P01 -- "내 기준으로<br>바꾸기" --> P25(["P25 완료 기준 바꾸기<br>저장 · 기본 기준으로 되돌리기"]):::pop
  S10 -- "내일로" --> T02>"T02 내일 다시 추천할게요"]:::toast
  dup -- "예" --> T03>"T03 이미 보상을 받을 미션이에요"]:::toast
  dup -- "아니오" --> first{"처음 해 보는<br>완료?"}:::q
  first -- "예, 1회만" --> P08(["P08 보상은 내일 도착해요"]):::pop
  first -- "아니오" --> P02
  P08 --> P02(["P02 완료 연출 ⑦<br>캐릭터 반응 · 적립 예정 +10"]):::dP
  P02 --> T01>"T01 완료했어요 · 되돌리기"]:::toast
  T01 -- "되돌리기" --> undo["당일 취소<br>적립 예정에서 빠짐"]:::q
  undo -- "다시 완료<br>카드의 다시 완료 버튼" --> dup
  P02 --> ten{"10번째<br>적립?"}:::q
  ten -- "예" --> P03(["P03 오늘 보상 다 모았어요"]):::pop
  P02 -. "자정" .-> mid(["정산<br>취소 제외 · 미션별 1회 · 10회까지"]):::q
  mid -. "다음 날 첫 접속" .-> P09(["P09 어제 보상 도착"]):::pop

classDef screen fill:#ffffff,stroke:#8b8174,stroke-width:1.5px,color:#2b2823
classDef pop fill:#e6eff7,stroke:#5f87a8,stroke-width:1.5px,color:#1f3446
classDef toast fill:#fbf0d2,stroke:#c29a2e,stroke-width:1.5px,color:#4a3a0c
classDef push fill:#f7e1d4,stroke:#c07a50,stroke-width:1.5px,color:#4c2a17
classDef empty fill:#eeece7,stroke:#9b968c,stroke-width:1.5px,color:#3d3a34
classDef q fill:#faf7f2,stroke:#b3aa9c,stroke-width:1.2px,color:#4a463f
classDef sys fill:#e9e6f2,stroke:#7c74a6,stroke-width:1.5px,color:#2c2747
classDef dS fill:#ffffff,stroke:#e0742a,stroke-width:2.5px,stroke-dasharray:7 4,color:#2b2823
classDef dP fill:#e6eff7,stroke:#e0742a,stroke-width:2.5px,stroke-dasharray:7 4,color:#1f3446
```

## 4. 미션 관리와 AI로 만들기

AI가 실패하거나 하루 20회를 다 쓰면 직접 입력(S13)으로 넘어간다. AI 결과는 미리보기에서 고친 뒤 저장한다.

```mermaid
flowchart TD
  S11["S11 내 미션 목록<br>구역별 · 켜기/끄기 · 밀린 정도"]:::screen
  S11 -- "켜진 미션 0개" --> E02[/"E02 켜진 미션 없음"/]:::empty
  E02 --> S15
  S11 -- "기본 미션 더 보기" --> S15["S15 기본 미션 둘러보기 ⑤"]:::dS
  S15 -- "켜기" --> S11
  S11 -- "미션 누르기" --> S12["S12 미션 상세<br>완료 기준 · 주기 · 수행 이력"]:::screen
  S12 -- "주기 바꾸기" --> P05(["P05 주기 바꾸기"]):::pop
  S12 -- "내 기준으로 바꾸기" --> P25(["P25 완료 기준 바꾸기"]):::pop
  S12 -- "수정" --> S13
  S12 -- "삭제" --> P06(["P06 삭제 확인"]):::pop
  P06 --> S11
  S11 -- "+ 추가" --> how{"만드는 방법"}:::q
  how -- "직접 입력" --> S13["S13 미션 만들기 · 수정<br>주기형 · 기한형"]:::screen
  how -- "AI로" --> quota{"오늘<br>20회 다 씀?"}:::q
  quota -- "예" --> P16(["P16 오늘 사용 횟수 소진"]):::pop
  P16 --> S13
  quota -- "아니오" --> aifirst{"AI 처음<br>사용?"}:::q
  aifirst -- "예" --> P15(["P15 외부 전송 안내 · 동의"]):::pop
  P15 --> S14
  aifirst -- "아니오" --> S14["S14 AI로 미션 만들기<br>입력 → 미리보기 카드"]:::screen
  S14 -- "생성 실패" --> P17(["P17 생성 실패<br>직접 입력으로"]):::pop
  P17 --> S13
  S14 -- "확인 후 저장" --> T04>"T04 저장했어요"]:::toast
  S13 -- "저장" --> T04
  T04 --> S11

classDef screen fill:#ffffff,stroke:#8b8174,stroke-width:1.5px,color:#2b2823
classDef pop fill:#e6eff7,stroke:#5f87a8,stroke-width:1.5px,color:#1f3446
classDef toast fill:#fbf0d2,stroke:#c29a2e,stroke-width:1.5px,color:#4a3a0c
classDef push fill:#f7e1d4,stroke:#c07a50,stroke-width:1.5px,color:#4c2a17
classDef empty fill:#eeece7,stroke:#9b968c,stroke-width:1.5px,color:#3d3a34
classDef q fill:#faf7f2,stroke:#b3aa9c,stroke-width:1.2px,color:#4a463f
classDef sys fill:#e9e6f2,stroke:#7c74a6,stroke-width:1.5px,color:#2c2747
classDef dS fill:#ffffff,stroke:#e0742a,stroke-width:2.5px,stroke-dasharray:7 4,color:#2b2823
classDef dP fill:#e6eff7,stroke:#e0742a,stroke-width:2.5px,stroke-dasharray:7 4,color:#1f3446
```

## 5. 방과 상점

산 아이템은 슬롯에 놓아야 방에 보인다. 상품 상세에서 방에 놓은 모습을 먼저 보여준다.

```mermaid
flowchart TD
  S10["S10 홈"]:::screen -- "방 누르기" --> S18
  S18["S18 방 꾸미기<br>슬롯 10개"]:::screen -- "슬롯 누르기" --> P14(["P14 슬롯 아이템 고르기"]):::pop
  P14 -- "배치" --> S18
  P14 -- "놓을 아이템 없음" --> E04[/"E04 시작 선물뿐<br>상점 가기"/]:::empty
  E04 --> S19
  S18 -- "상점" --> S19["S19 상점<br>카테고리 · 잔액"]:::screen
  S19 -- "전부 보유" --> E05[/"E05 모든 상품 보유"/]:::empty
  S19 -- "상품 누르기" --> P10(["P10 상품 상세<br>방에 놓은 모습 · 가격"]):::pop
  P10 -- "구매" --> bal{"잔액<br>충분?"}:::q
  bal -- "아니오" --> P12(["P12 잔액 부족 ⑧<br>n 더 모으면 살 수 있어요"]):::dP
  bal -- "예" --> P11(["P11 구매 확인<br>가격 · 구매 후 잔액"]):::pop
  P11 --> P13(["P13 구매 완료<br>바로 놓을까요? ⑨"]):::dP
  P13 -- "놓기" --> P14
  P13 -- "나중에" --> S19

classDef screen fill:#ffffff,stroke:#8b8174,stroke-width:1.5px,color:#2b2823
classDef pop fill:#e6eff7,stroke:#5f87a8,stroke-width:1.5px,color:#1f3446
classDef toast fill:#fbf0d2,stroke:#c29a2e,stroke-width:1.5px,color:#4a3a0c
classDef push fill:#f7e1d4,stroke:#c07a50,stroke-width:1.5px,color:#4c2a17
classDef empty fill:#eeece7,stroke:#9b968c,stroke-width:1.5px,color:#3d3a34
classDef q fill:#faf7f2,stroke:#b3aa9c,stroke-width:1.2px,color:#4a463f
classDef sys fill:#e9e6f2,stroke:#7c74a6,stroke-width:1.5px,color:#2c2747
classDef dS fill:#ffffff,stroke:#e0742a,stroke-width:2.5px,stroke-dasharray:7 4,color:#2b2823
classDef dP fill:#e6eff7,stroke:#e0742a,stroke-width:2.5px,stroke-dasharray:7 4,color:#1f3446
```

## 6. 기록

완료 취소는 오늘 날짜만 가능하고, 취소한 미션은 같은 날 다시 완료할 수 있다.

```mermaid
flowchart LR
  S16["S16 기록<br>날짜 목록 · 구역별 마지막 수행일"]:::screen -- "첫날" --> E03[/"E03 기록 없음"/]:::empty
  S16 -- "날짜 누르기" --> S17["S17 날짜별 상세 ⑥<br>추천 · 완료 · 내일로 · 정산 결과"]:::dS
  S17 -- "오늘 완료 취소" --> P04(["P04 취소 확인"]):::pop
  P04 --> S17
  S17 -- "취소한 미션<br>다시 완료" --> redo["다시 적립 예정"]:::q
classDef screen fill:#ffffff,stroke:#8b8174,stroke-width:1.5px,color:#2b2823
classDef pop fill:#e6eff7,stroke:#5f87a8,stroke-width:1.5px,color:#1f3446
classDef toast fill:#fbf0d2,stroke:#c29a2e,stroke-width:1.5px,color:#4a3a0c
classDef push fill:#f7e1d4,stroke:#c07a50,stroke-width:1.5px,color:#4c2a17
classDef empty fill:#eeece7,stroke:#9b968c,stroke-width:1.5px,color:#3d3a34
classDef q fill:#faf7f2,stroke:#b3aa9c,stroke-width:1.2px,color:#4a463f
classDef sys fill:#e9e6f2,stroke:#7c74a6,stroke-width:1.5px,color:#2c2747
classDef dS fill:#ffffff,stroke:#e0742a,stroke-width:2.5px,stroke-dasharray:7 4,color:#2b2823
classDef dP fill:#e6eff7,stroke:#e0742a,stroke-width:2.5px,stroke-dasharray:7 4,color:#1f3446
```

## 7. 설정과 계정

알림·쉬는 날을 바꾸면 그 자리에서 알림 예약을 다시 한다. 탈퇴는 즉시 비활성화, 30일 뒤 식별정보 파기(기획서 17.3).

```mermaid
flowchart LR
  S20["S20 설정"]:::screen -- "알림 시간 · 쉬는 날" --> re["알림 다시 예약"]:::q
  S20 -- "알림이 꺼져 있음" --> P19(["P19 알림 다시 켜는 법"]):::pop
  S20 -- "홈 화면 추가" --> P20(["P20 홈 화면 추가 방법"]):::pop
  S20 -- "약관 보기" --> S22["S22 약관 · 개인정보"]:::screen
  S20 -- "로그아웃" --> P21(["P21 로그아웃 확인"]):::pop
  S20 -- "회원 탈퇴" --> S21["S21 회원 탈퇴 안내"]:::screen
  S21 --> P22(["P22 탈퇴 최종 확인"]):::pop
  P21 --> S01["S01 랜딩"]:::screen
  P22 --> S01
classDef screen fill:#ffffff,stroke:#8b8174,stroke-width:1.5px,color:#2b2823
classDef pop fill:#e6eff7,stroke:#5f87a8,stroke-width:1.5px,color:#1f3446
classDef toast fill:#fbf0d2,stroke:#c29a2e,stroke-width:1.5px,color:#4a3a0c
classDef push fill:#f7e1d4,stroke:#c07a50,stroke-width:1.5px,color:#4c2a17
classDef empty fill:#eeece7,stroke:#9b968c,stroke-width:1.5px,color:#3d3a34
classDef q fill:#faf7f2,stroke:#b3aa9c,stroke-width:1.2px,color:#4a463f
classDef sys fill:#e9e6f2,stroke:#7c74a6,stroke-width:1.5px,color:#2c2747
classDef dS fill:#ffffff,stroke:#e0742a,stroke-width:2.5px,stroke-dasharray:7 4,color:#2b2823
classDef dP fill:#e6eff7,stroke:#e0742a,stroke-width:2.5px,stroke-dasharray:7 4,color:#1f3446
```

## 어디서든 나타나는 것

| ID | 무엇 | 언제 | 이어지는 곳 |
|---|---|---|---|
| T07 | 알림 꺼짐 배너 | 알림을 설정하지 않은 사용자의 홈 상단 | P18 → 브라우저 권한 |
| T08 | 홈 화면 추가 배너 | iOS에서 홈 화면 추가 전인 사용자의 홈 상단 | P20 |
| T05 | 오프라인 배너 | 연결이 끊겼을 때 | 계속 끊겨 있으면 S23 |
| T06 | 새 버전 · 새로고침 | 새 배포를 감지했을 때 | 새로고침 |
| P23 | 로그인 만료 | 세션이 끝났을 때 | S01 |
| P24 | 오류 · 다시 시도 | 다시 시도하면 되는 오류 | 원래 화면 |
| S24 | 404 · 오류 화면 | 없는 주소, 복구할 수 없는 오류 | 홈 |

## ID 색인

- **화면**: S01 랜딩 · S02 약관 동의 · S03 환영 소개 · S04 캐릭터 고르기 · S05 생활 정보 · S06 켜질 미션 확인 · S07 알림 시간·쉬는 날 · S08 홈 화면 추가·알림 허용 · S09 시작 선물 · S10 홈 · S11 내 미션 목록 · S12 미션 상세 · S13 미션 만들기·수정 · S14 AI로 미션 만들기 · S15 기본 미션 둘러보기 · S16 기록 · S17 날짜별 기록 상세 · S18 방 꾸미기 · S19 상점 · S20 설정 · S21 회원 탈퇴 · S22 약관·개인정보처리방침 · S23 오프라인 · S24 404·오류
- **팝업**: P01 완료 기준 보기 · P02 완료 연출 · P03 오늘 보상 다 모음 · P04 완료 취소 확인 · P05 주기 바꾸기 · P06 미션 삭제 확인 · P07 기한 지난 미션 · P08 정산 방식 안내 · P09 어제 보상 도착 · P10 상품 상세 · P11 구매 확인 · P12 잔액 부족 · P13 구매 완료 · P14 슬롯 아이템 고르기 · P15 AI 외부 전송 안내 · P16 AI 사용 횟수 소진 · P17 AI 생성 실패 · P18 알림 허용 사전 안내 · P19 알림 거부 안내 · P20 홈 화면 추가 방법 · P21 로그아웃 확인 · P22 탈퇴 최종 확인 · P23 로그인 만료 · P24 오류 · P25 완료 기준 바꾸기
- **토스트·배너**: T01 완료·되돌리기 · T02 내일 다시 추천 · T03 이미 적립 예정 · T04 저장 완료 · T05 오프라인 · T06 새 버전 · T07 알림 꺼짐 · T08 홈 화면 추가
- **빈 상태**: E01 오늘 추천 없음 · E02 켜진 미션 없음 · E03 기록 없음 · E04 놓을 아이템 없음 · E05 모든 상품 보유
- **푸시**: N01 기본 알림 · N02 저녁 알림 (21:00)
