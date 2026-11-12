// 대화형 AI 공통 규칙(순수 함수) — AI 자취 매니저 채팅과 비상매뉴얼 AI가 함께 사용
import { ChatTurn } from "./types";

export const MAX_MESSAGE_LEN = 500;
export const MAX_HISTORY_TURNS = 6;

// 위급 안내 문구는 여기서만 수정한다. 번호·문구는 팀에서 최종 확인할 것.
export const CALL_119_LINE = "지금 위급한 상황이라면 먼저 119에 전화해 주세요.";
const SELF_HARM_REPLY =
  "많이 힘드신 것 같아요. 혼자 견디지 않으셨으면 해요. 지금 바로 24시간 상담받을 수 있는 109(자살예방상담전화)에 전화해 보세요. 당장 위험한 상황이라면 119에 연락해 주세요.";

const EMERGENCY = ["화재", "불이 났", "불났", "가스 냄새", "가스냄새", "가스 누출", "가스누출", "연기가", "감전", "쓰러졌", "의식이 없", "숨을 못", "심정지", "응급", "119"];
const SELF_HARM = ["자살", "죽고 싶", "죽고싶", "자해", "목숨을 끊"];

export type SafetyKind = "self_harm" | "emergency";

export function safetyKind(message: string): SafetyKind | null {
  const m = message.replace(/\s+/g, " ");
  if (SELF_HARM.some((k) => m.includes(k))) return "self_harm";
  if (EMERGENCY.some((k) => m.includes(k))) return "emergency";
  return null;
}

// LLM을 거치지 않고 고정 안내를 돌려주는 안전 장치
export function safetyReply(message: string): string | null {
  const kind = safetyKind(message);
  if (kind === "self_harm") return SELF_HARM_REPLY;
  if (kind === "emergency") {
    return `${CALL_119_LINE} 안전한 곳으로 이동하는 게 가장 중요해요. 앱의 비상매뉴얼에서 상황별 대처 방법도 확인할 수 있어요.`;
  }
  return null;
}

// 클라이언트가 보낸 history를 검증·정리: 최근 N턴, 길이 제한, user로 시작, 같은 role 연속 시 병합
export function normalizeHistory(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  const turns: ChatTurn[] = [];
  for (const t of raw.slice(-MAX_HISTORY_TURNS)) {
    if (!t || (t.role !== "user" && t.role !== "assistant") || typeof t.content !== "string") continue;
    const content = t.content.trim().slice(0, MAX_MESSAGE_LEN);
    if (!content) continue;
    const last = turns[turns.length - 1];
    if (last && last.role === t.role) last.content += `\n${content}`;
    else turns.push({ role: t.role, content });
  }
  while (turns.length > 0 && turns[0].role !== "user") turns.shift();
  if (turns.length > 0 && turns[turns.length - 1].role === "user") turns.pop(); // 마지막은 새 질문이 이어짐
  return turns;
}
