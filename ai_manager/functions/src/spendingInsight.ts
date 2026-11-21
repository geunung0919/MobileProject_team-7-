// 소비 분석 'AI 한마디': 증감 계산은 코드가 하고, AI는 그 결과를 1~2문장으로 풀어쓴다.
import { askLlm } from "./llm";
import { collectNumbers, formatWon, textsAreGrounded } from "./validate";

export const DAILY_SPENDING_INSIGHT_LIMIT = 20;
const MAX_CATEGORIES = 12;
const MAX_NAME = 20;
const MAX_TEXT = 140;

export interface CategoryAmount { name: string; amount: number }
export interface SpendingInsightInput { year: number; month: number; categories: CategoryAmount[]; prev: CategoryAmount[] }
export interface SpendingFacts {
  period: string;
  total: number;
  prev_total: number;
  total_diff: number;
  top_up: { name: string; amount: number; prev_amount: number; diff: number } | null;
  top_down: { name: string; amount: number; prev_amount: number; diff: number } | null;
  top_category: { name: string; amount: number } | null;
}

const clean = (v: unknown): CategoryAmount[] => {
  if (!Array.isArray(v)) return [];
  const merged = new Map<string, number>();
  for (const x of v.slice(0, 50)) {
    const name = typeof x?.name === "string" ? x.name.trim().slice(0, MAX_NAME) : "";
    const amount = Number(x?.amount);
    if (!name || !Number.isFinite(amount) || amount <= 0 || amount > 1e10) continue;
    merged.set(name, (merged.get(name) ?? 0) + Math.round(amount));
  }
  return [...merged.entries()].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, MAX_CATEGORIES);
};

export function normalizeInsightInput(data: any): SpendingInsightInput | null {
  const year = Number(data?.year);
  const month = Number(data?.month);
  if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) return null;
  return { year, month, categories: clean(data?.categories), prev: clean(data?.prev) };
}

export function buildFacts(input: SpendingInsightInput): SpendingFacts | null {
  const total = input.categories.reduce((s, c) => s + c.amount, 0);
  if (total <= 0) return null;
  const prevMap = new Map(input.prev.map((c) => [c.name, c.amount]));
  const prev_total = input.prev.reduce((s, c) => s + c.amount, 0);
  const diffs = input.categories.map((c) => {
    const p = prevMap.get(c.name) ?? 0;
    return { name: c.name, amount: c.amount, prev_amount: p, diff: c.amount - p };
  });
  // 지난달에만 있고 이번 달엔 없는 카테고리(감소)도 후보
  for (const p of input.prev) if (!input.categories.some((c) => c.name === p.name)) diffs.push({ name: p.name, amount: 0, prev_amount: p.amount, diff: -p.amount });
  const up = diffs.filter((d) => d.diff > 0 && prev_total > 0).sort((a, b) => b.diff - a.diff)[0] ?? null;
  const down = diffs.filter((d) => d.diff < 0 && prev_total > 0).sort((a, b) => a.diff - b.diff)[0] ?? null;
  const top = input.categories[0];
  return {
    period: `${input.year}년 ${input.month}월`,
    total,
    prev_total,
    total_diff: total - prev_total,
    top_up: up,
    top_down: down,
    top_category: top ? { name: top.name, amount: top.amount } : null,
  };
}

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

// AI 없이도 나오는 기본 문장 (화면의 로컬 문장과 같은 규칙)
export function fallbackComment(f: SpendingFacts): string {
  if (f.prev_total <= 0) {
    return f.top_category ? `${f.top_category.name} 지출이 ${won(f.top_category.amount)}으로 가장 많아요. 다음 달과 비교할 수 있도록 계속 기록해 보세요.` : "지출을 기록하면 비교해서 알려드릴게요.";
  }
  if (f.top_up && f.total_diff > 0) {
    return `저번 달보다 ${f.top_up.name} 지출이 ${won(f.top_up.diff)} 더 많아요. ${f.top_up.name} 소비를 조금 줄여 보는 게 좋겠어요.`;
  }
  if (f.top_down && f.total_diff < 0) {
    return `저번 달보다 전체 지출이 ${won(-f.total_diff)} 줄었어요. 특히 ${f.top_down.name} 지출이 ${won(-f.top_down.diff)} 줄었어요. 잘하고 있어요!`;
  }
  return "저번 달과 지출이 비슷해요. 지금처럼 유지해 보세요.";
}

export const INSIGHT_SYSTEM = `당신은 자취 생활 앱 '자취메이트'의 소비 분석 도우미입니다.
아래 [지출 데이터]만 근거로 "spending_comment" 한 개를 한국어 해요체 1~2문장(${MAX_TEXT}자 이내)으로 씁니다.
규칙:
- 지난달보다 늘어난 카테고리가 있으면 그것을 먼저 짚고 "~ 소비를 줄여 보면 좋겠어요" 같은 구체적 제안으로 마무리합니다.
- 전체가 줄었으면 칭찬하고 가장 크게 줄어든 카테고리를 언급합니다.
- 지난달 데이터가 없으면(prev_total 0) 비교하지 말고 가장 큰 지출 카테고리만 알려 줍니다.
- 데이터에 없는 숫자·카테고리·원인을 지어내지 않습니다. 금액은 데이터의 값을 그대로 "12,000원" 형태로 씁니다. 퍼센트·'만원' 환산 금지.
- 비난하거나 겁주지 않고 따뜻하게 씁니다.
반드시 JSON 한 개만 출력: {"spending_comment": "..."}
[지출 데이터]
`;

export async function generateInsight(apiKey: string, f: SpendingFacts): Promise<string | null> {
  const allowed = collectNumbers(f);
  for (let i = 0; i < 2; i++) {
    try {
      const raw = await askLlm(apiKey, INSIGHT_SYSTEM + JSON.stringify(f), [{ role: "user", content: "한마디 써 주세요." }], 300);
      const o = JSON.parse(raw.replace(/```json|```/g, "").trim());
      const text = typeof o?.spending_comment === "string" ? o.spending_comment.trim() : "";
      if (!text || text.length > MAX_TEXT) continue;
      if (!textsAreGrounded([text], allowed)) continue;
      return formatWon(text);
    } catch {
      /* 재시도 */
    }
  }
  return null;
}
