// P25·S13에서 적은 완료 기준을 작성 규칙(기획서 8.2)에 비춰 안내한다. 막지는 않는다.

/** 정도를 판단해야 하는 상태 문장. 사람마다 기준이 갈린다 */
const STATE_WORDS = [
  "보이지 않으면",
  "안 보이면",
  "깨끗해지면",
  "깨끗하면",
  "깔끔해지면",
  "깔끔하면",
  "반짝이면",
  "반짝반짝",
  "말끔해지면",
  "정리되면",
];

export type CriteriaHint = "state" | "ending";

export const HINT_MESSAGES: Record<CriteriaHint, string> = {
  state:
    "‘깨끗해지면’처럼 정도를 보는 말 대신, 무엇으로 어디를 몇 번 했는지로 적으면 끝을 알기 쉬워요.",
  ending: "‘~면 완료’로 끝내면 어디서 멈추면 되는지 한눈에 보여요.",
};

export function criteriaHints(text: string): CriteriaHint[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const hints: CriteriaHint[] = [];
  if (STATE_WORDS.some((word) => trimmed.includes(word))) hints.push("state");
  if (!/면 완료\.?$/.test(trimmed)) hints.push("ending");
  return hints;
}
