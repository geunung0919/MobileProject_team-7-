// LLM 응답 검증(순수 함수): 형식·길이 + "요약 데이터에 없는 숫자"를 차단
import { AiReport } from "./types";

export const REPORT_LIMITS = { today_message: 80, summary: 150, action: 40, max_actions: 3 };
// 문장에 자연스럽게 섞이는 숫자(예: "1개씩", "0원")는 허용
const ALWAYS_OK = new Set([0, 1]);

// 텍스트 속 숫자 추출: "140,000원" → 140000, "D-3" → 3, "1544-4500" → 1544, 4500 (부호는 무시)
export function numbersIn(text: string): number[] {
  return (text.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((s) => Number(s.replace(/,/g, ""))).filter((n) => Number.isFinite(n));
}

// 객체/배열/문자열에서 등장하는 모든 숫자 → 허용 목록
export function collectNumbers(value: unknown, out = new Set<number>()): Set<number> {
  if (typeof value === "number") out.add(Math.abs(value));
  else if (typeof value === "string") numbersIn(value).forEach((n) => out.add(n));
  else if (Array.isArray(value)) value.forEach((v) => collectNumbers(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => collectNumbers(v, out));
  return out;
}

// 금액 추출: "110,000원" → 110000, "13만원" / "13만 원" → 130000
export function amountsIn(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(만)?\s*원/g)) {
    const n = Number(m[1].replace(/,/g, ""));
    out.push(m[2] ? Math.round(n * 10_000) : n);
  }
  return out;
}

// 금액 표기 통일: "110000원" → "110,000원" (모델이 쉼표를 빼먹어도 화면에는 같은 형식으로)
export function formatWon(text: string): string {
  return text.replace(/(?<![\d,.])(\d{4,})(?=\s*원)/g, (n) => Number(n).toLocaleString("ko-KR"));
}

// 비율·배수(%, 퍼센트, 배)는 요약 데이터에 있는 숫자여야 한다 (AI가 직접 계산한 "2.75배" 같은 값 차단)
export function ratiosAreGrounded(text: string, allowed: Set<number>): boolean {
  for (const m of text.matchAll(/(\d+(?:\.\d+)?)\s*(?:%|퍼센트|배)/g)) {
    const n = Number(m[1]);
    if (!ALWAYS_OK.has(n) && !allowed.has(n)) return false;
  }
  return true;
}

// 채팅용(느슨한 검증): 금액만 확인. "3일 보관" 같은 일반 숫자는 통과
export function amountsAreGrounded(text: string, allowed: Set<number>): boolean {
  return amountsIn(text).every((n) => ALWAYS_OK.has(n) || allowed.has(n));
}

// 리포트용(엄격한 검증): 모든 숫자가 요약 데이터에 있어야 하고, '만원' 환산 표기는 차단
export function parseReport(text: string, allowed: Set<number>): AiReport | null {
  let o: Record<string, unknown>;
  try {
    o = JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
  if (!o || typeof o !== "object") return null;

  const str = (k: string, max: number) => {
    const v = o[k];
    return typeof v === "string" && v.trim() && v.trim().length <= max ? v.trim() : null;
  };
  const today_message = str("today_message", REPORT_LIMITS.today_message);
  const expense_summary = str("expense_summary", REPORT_LIMITS.summary);
  const inventory_summary = str("inventory_summary", REPORT_LIMITS.summary);
  const routine_summary = str("routine_summary", REPORT_LIMITS.summary);
  if (!today_message || !expense_summary || !inventory_summary || !routine_summary) return null;

  if (!Array.isArray(o.actions) || o.actions.length === 0 || o.actions.length > REPORT_LIMITS.max_actions) return null;
  const actions = o.actions.map((a) => (typeof a === "string" ? a.trim() : ""));
  if (actions.some((a) => !a || a.length > REPORT_LIMITS.action)) return null;

  const report: AiReport = { today_message, expense_summary, inventory_summary, routine_summary, actions };
  if (!textsAreGrounded([today_message, expense_summary, inventory_summary, routine_summary, ...actions], allowed)) return null;
  return {
    today_message: formatWon(today_message),
    expense_summary: formatWon(expense_summary),
    inventory_summary: formatWon(inventory_summary),
    routine_summary: formatWon(routine_summary),
    actions: actions.map(formatWon),
  };
}

// 엄격한 숫자 검증 (리포트·주간 리포트 공용): 모든 숫자가 허용 목록에 있어야 하고, '만원' 환산 표기는 차단
export function textsAreGrounded(texts: string[], allowed: Set<number>): boolean {
  const all = texts.join("\n");
  if (/\d\s*만\s*원?/.test(all)) return false; // 환산 표기는 원래 숫자와 대조할 수 없으므로 차단
  return numbersIn(all).every((n) => ALWAYS_OK.has(n) || allowed.has(n));
}
