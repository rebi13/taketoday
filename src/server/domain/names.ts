import "server-only";

// 사용자가 짓는 이름(캐릭터 이름, 닉네임)을 정리·검사하고, 랜덤 닉네임을 만든다.

export type NameResult =
  | { ok: true; name: string }
  | { ok: false; reason: "empty" | "too-short" | "too-long" | "invalid-char" };

/**
 * 앞뒤 공백을 지우고 가운데 연속 공백을 하나로 줄인 뒤 길이를 센다.
 * 길이는 DB의 char_length와 같은 기준(코드 포인트)으로 센다.
 * 줄바꿈·탭 같은 제어 문자는 받지 않는다.
 */
export function normalizeName(
  raw: string,
  { minLength, maxLength }: { minLength: number; maxLength: number },
): NameResult {
  const name = raw.trim().replace(/ {2,}/g, " ");
  if (!name) return { ok: false, reason: "empty" };
  // eslint-disable-next-line no-control-regex -- 제어 문자를 찾는 것이 목적이다
  if (/[\u0000-\u001f\u007f]/.test(name)) {
    return { ok: false, reason: "invalid-char" };
  }
  const length = [...name].length;
  if (length < minLength) return { ok: false, reason: "too-short" };
  if (length > maxLength) return { ok: false, reason: "too-long" };
  return { ok: true, name };
}

// ── 랜덤 닉네임 ──
// 형용사 + 명사 + 숫자 4자리. 예: 포근한먼지0582
// 20 × 20 × 10,000 = 400만 가지. 겹칠 수는 있으므로 DB 유니크 제약과 재시도로 막는다.
// 다그치지 않는 말투(기획서 원칙 3)로, 서비스의 생활·방 분위기에 맞는 단어만 쓴다.

export const NICKNAME_ADJECTIVES = [
  "포근한",
  "느긋한",
  "반짝이는",
  "산뜻한",
  "다정한",
  "보송한",
  "말랑한",
  "상냥한",
  "차분한",
  "싱그러운",
  "따뜻한",
  "맑은",
  "동글한",
  "사뿐한",
  "폭신한",
  "꼼꼼한",
  "부지런한",
  "너그러운",
  "해맑은",
  "든든한",
] as const;

export const NICKNAME_NOUNS = [
  "먼지",
  "토끼",
  "고양이",
  "햄스터",
  "화분",
  "이불",
  "머그컵",
  "양말",
  "쿠션",
  "빗자루",
  "수세미",
  "행주",
  "바구니",
  "창문",
  "햇살",
  "구름",
  "새싹",
  "솜뭉치",
  "책갈피",
  "단추",
] as const;

/** 0 이상 max 미만의 정수를 돌려주는 난수. 서비스에서는 crypto.randomInt를 넘긴다 */
export type RandomInt = (max: number) => number;

export function generateNickname(randomInt: RandomInt): string {
  const adjective = NICKNAME_ADJECTIVES[randomInt(NICKNAME_ADJECTIVES.length)];
  const noun = NICKNAME_NOUNS[randomInt(NICKNAME_NOUNS.length)];
  const digits = String(randomInt(10_000)).padStart(4, "0");
  return `${adjective}${noun}${digits}`;
}
