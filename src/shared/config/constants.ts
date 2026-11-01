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
