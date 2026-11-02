// 금액·상한·시각 상수는 여기 한 곳에만 둔다(CLAUDE.md "도메인 규칙").

/** "하루"를 자르는 기준 시간대. 하루는 한국 시간 자정에 바뀐다(기획서 6.6) */
export const SERVICE_TIME_ZONE = "Asia/Seoul";

/** 미션 1회 완료 보상 (기획서 7.1) */
export const MISSION_REWARD = 10;

/** 하루 개인 보상 상한 횟수. 정산은 앞에서 이만큼만 인정한다(ADR 0003) */
export const DAILY_PERSONAL_REWARD_CAP = 10;

/** AI로 미션 만들기 하루 사용 횟수 (기획서 15.1) */
export const AI_DRAFT_DAILY_LIMIT = 20;

/** 기본 하루 추천 개수 */
export const DEFAULT_DAILY_RECOMMEND_COUNT = 2;

/** 저녁 알림 시각, 서울 기준 HH:mm (기획서 6.9) */
export const EVENING_NOTIFY_TIME = "21:00";

/** 미션 이름 최대 길이 (기획서 6.4) */
export const MISSION_NAME_MAX_LENGTH = 40;

/** 완료 기준 최대 길이 (기획서 6.4) */
export const CHECK_CRITERIA_MAX_LENGTH = 80;

/** 캐릭터 이름 최대 길이. 방 화면 말풍선에 한 줄로 들어가는 길이 */
export const CHARACTER_NAME_MAX_LENGTH = 10;

/**
 * 동의받는 약관·개인정보처리방침 버전(시행일). 본문을 바꾸면 올리고, 이전 버전에
 * 동의한 사용자에게 다시 동의를 받는다. 지금은 법률 검토 전 초안이다(기획서 17장, #41)
 */
export const TERMS_VERSION = "2026-11-01";

/** 닉네임 길이. 랜덤 닉네임(형용사+명사+숫자 4자리)이 최대 11자라 그보다 조금 넉넉히 */
export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 12;

/** 온보딩 S07의 기본 알림 시각 기본값, 서울 기준 HH:mm. 저녁 알림(21:00)과 떨어지게 아침으로 */
export const DEFAULT_NOTIFY_TIME = "08:00";

/** 온보딩 S05의 조건 태그. 고르면 그 조건의 기본 미션이 켜진다(기획서 8.6). seed/schema.ts와 같다 */
export const CONDITION_TAGS = [
  "pet",
  "plant",
  "car",
  "aircon",
  "humidifier",
] as const;
export type ConditionTag = (typeof CONDITION_TAGS)[number];

/** 온보딩 S05의 거주 형태 */
export const HOUSEHOLDS = ["solo", "shared"] as const;
export type Household = (typeof HOUSEHOLDS)[number];

/** 기본 알림이 이 시각(서울, HH:mm) 이후면 저녁 알림과 너무 가까워 저녁 알림을 보내지 않는다(기획서 6.9) */
export const EVENING_NOTIFY_CUTOFF = "20:00";

/** 주기형 미션의 주기 범위(일). 기본 미션의 가장 긴 주기가 1년이다 */
export const MISSION_CYCLE_MIN_DAYS = 1;
export const MISSION_CYCLE_MAX_DAYS = 365;

/** 미션 켜기·끄기를 한 번에 바꿀 수 있는 개수. 구역 하나의 미션이 이보다 많을 일은 없다 */
export const MISSION_BATCH_MAX = 200;
