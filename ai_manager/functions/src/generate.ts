import { askLlm } from "./llm";
import { buildContext, buildUserPrompt, SYSTEM_PROMPT } from "./prompt";
import { AiReport, AnalysisResult, Facts, Profile } from "./types";
import { collectNumbers, parseReport } from "./validate";

const MAX_ATTEMPTS = 2;

// 성공하면 검증된 리포트, 실패하면 null (호출 측에서 이전 리포트 또는 fallbackReport)
export async function generateReport(apiKey: string, profile: Profile, analysis: AnalysisResult): Promise<AiReport | null> {
  const allowed = collectNumbers(buildContext(profile, analysis));
  const user = buildUserPrompt(profile, analysis);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const text = await askLlm(apiKey, SYSTEM_PROMPT, [{ role: "user", content: user }], 600);
      const report = parseReport(text, allowed);
      if (report) return report;
      console.warn(`report validation failed (attempt ${attempt})`);
    } catch (err) {
      console.error(`report LLM call failed (attempt ${attempt})`, err);
    }
  }
  return null;
}

// ---------------------------------------------------------------------
// AI 없이 만드는 템플릿 리포트 (AI 실패 + 이전 리포트도 없을 때). 숫자는 분석 결과를 그대로 사용.
// ---------------------------------------------------------------------
const won = (n: unknown) => `${Number(n).toLocaleString("ko-KR")}원`;
const num = (f: Facts, k: string) => (typeof f[k] === "number" ? (f[k] as number) : null);

export function fallbackReport(a: AnalysisResult): AiReport {
  const { expense: e, inventory: inv, routine: r } = a.summary;

  if (a.cold_start) {
    return {
      today_message: "자취메이트에 오신 걸 환영해요! 첫 기록부터 시작해 볼까요?",
      expense_summary: "아직 소비 기록이 없어요.",
      inventory_summary: "아직 등록된 재료가 없어요.",
      routine_summary: "아직 등록된 루틴이 없어요.",
      actions: ["영수증 한 장 등록하기", "냉장고 재료 등록하기"],
    };
  }

  const remaining = num(e, "remaining_budget");
  const expense_summary =
    num(e, "budget_total") !== null && remaining !== null
      ? `이번 달 ${won(e.month_total)}을 썼고, 남은 예산은 ${won(remaining)}이에요.`
      : num(e, "month_total")
        ? `이번 달 ${won(e.month_total)}을 썼어요.`
        : "이번 달 소비 기록이 아직 없어요.";

  const expiring = (inv.expiring_items as string[]) ?? [];
  const inventory_summary =
    num(inv, "item_count") === 0
      ? "등록된 재료가 없어요."
      : expiring.length > 0
        ? `소비기한이 가까운 재료가 ${expiring.length}개 있어요: ${expiring.join(", ")}`
        : `재료 ${inv.item_count}개를 보관 중이에요.`;

  const routine_summary =
    num(r, "routine_count") === 0
      ? "등록된 루틴이 없어요."
      : num(r, "completion_percent") !== null
        ? `최근 7일 루틴 완료율은 ${r.completion_percent}%예요.`
        : Array.isArray(r.today_routines) && r.today_routines.length > 0
          ? `오늘 루틴 ${r.today_routines.length}개 중 ${r.today_done}개를 완료했어요.`
          : `루틴 ${r.routine_count}개를 관리 중이에요.`;

  const top = a.insights[0];
  const f = top?.facts ?? {};
  const byCode: Record<string, [string, string]> = {
    BUDGET_PACE: [
      num(f, "remaining_budget")! < 0
        ? `이번 달 예산을 ${won(-(f.remaining_budget as number))} 넘었어요.`
        : `이번 달 예산의 ${f.spent_percent}%를 썼어요.`,
      "이번 주 지출 한 번 점검하기",
    ],
    FOOD_OVER: [`식비가 ${won(f.food_spent)}으로 식비 예산에 도달했어요.`, "오늘은 집에 있는 재료로 한 끼"],
    EXPIRING: [
      num(f, "expiring_count")
        ? `소비기한이 가까운 재료가 ${f.expiring_count}개 있어요.`
        : "소비기한이 지난 재료가 있어요. 상태를 확인해 주세요.",
      "임박 재료부터 사용하기",
    ],
    WASTE: [`최근 30일 동안 폐기 기록이 ${f.waste_count_30d}건 있어요.`, "장보기 전에 냉장고 먼저 확인하기"],
    STOCK_EMPTY: ["냉장고에 등록된 재료가 없어요.", "냉장고 재료 등록하기"],
    ROUTINE_LOW: [`최근 7일 루틴 완료율이 ${f.completion_percent}%예요.`, "오늘 루틴 하나만 완료하기"],
  };
  const [today_message, action] = (top && byCode[top.code]) ?? ["오늘도 자취 생활을 기록해 볼까요?", "오늘 지출 기록하기"];
  const extra = a.insights[1] && byCode[a.insights[1].code]?.[1];

  return {
    today_message,
    expense_summary,
    inventory_summary,
    routine_summary,
    actions: extra && extra !== action ? [action, extra] : [action],
  };
}
