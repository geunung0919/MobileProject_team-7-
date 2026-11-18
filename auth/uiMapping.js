// UIUX-Edit 화면 값 ↔ Firebase 저장 형식 변환 (1번 모듈). 화면 코드는 그대로 두고 저장·불러오기 때만 씁니다.
//
// UIUX-Edit (src/data/more/lifeData.js)            Firebase users/{uid}.profile
//   period  'under1m' | '1m' | '6m' | '1y'    →     living_months 0 | 1 | 6 | 12
//   goal    'saving' | 'food' | 'habit'       →     priority save_money | reduce_waste | build_routine
//   tools   ['microwave','gas','cooker','airfryer'] 또는 ['none']
//                                              →     cooking_tools microwave·stove·rice_cooker·air_fryer 목록 ([]=없음)
//   cookDays 0~7                              →     cooking_days_per_week
//   budget  숫자(원)                           →     monthly_budget_krw
//   region  '서울시 마포구' (직접 입력)         →     region_name (지역 검색으로 고르면 setRegion(code) 이 region_code 도 저장)

const PERIOD_TO_MONTHS = { under1m: 0, '1m': 1, '6m': 6, '1y': 12 };
const GOAL_TO_PRIORITY = { saving: 'save_money', food: 'reduce_waste', habit: 'build_routine' };
const TOOL_TO_VALUE = { microwave: 'microwave', gas: 'stove', cooker: 'rice_cooker', airfryer: 'air_fryer' };

const invert = (map) => Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]));
const PRIORITY_TO_GOAL = invert(GOAL_TO_PRIORITY);
const VALUE_TO_TOOL = invert(TOOL_TO_VALUE);

const toNumberOrNull = (v) => {
  if (v === '' || v == null) return null;
  const n = Number(String(v).replace(/[^0-9]/g, ''));
  return Number.isFinite(n) ? n : null;
};

// 화면 값 → 저장 형식. 넘긴 항목만 변환합니다(updateProfile 에 바로 넘길 수 있음).
export function toProfile({ period, goal, tools, cookDays, budget, region } = {}) {
  const out = {};
  if (period !== undefined) out.living_months = PERIOD_TO_MONTHS[period] ?? null;
  if (goal !== undefined) out.priority = GOAL_TO_PRIORITY[goal] ?? null;
  if (tools !== undefined) {
    out.cooking_tools = !Array.isArray(tools) || tools.length === 0 ? null
      : tools.includes('none') ? []
      : tools.map((t) => TOOL_TO_VALUE[t]).filter(Boolean);
  }
  if (cookDays !== undefined) {
    const n = toNumberOrNull(cookDays);
    out.cooking_days_per_week = n == null ? null : Math.max(0, Math.min(7, n));
  }
  if (budget !== undefined) out.monthly_budget_krw = toNumberOrNull(budget);
  if (region !== undefined) {
    const name = String(region ?? '').trim();
    out.region_name = name || null;
    out.region_code = null; // 직접 입력한 이름에는 법정동 코드가 없음
  }
  return out;
}

// 저장 형식 → 화면 값 (생활 데이터 수정·프로필 화면 처음 값). 없는 값은 화면 기본값(fallback)을 씁니다.
export function fromProfile(profile, fallback = {}) {
  const p = profile || {};
  const monthsToPeriod = (m) => (m == null ? undefined : m >= 12 ? '1y' : m >= 6 ? '6m' : m >= 1 ? '1m' : 'under1m');
  const tools = p.cooking_tools == null ? undefined
    : p.cooking_tools.length === 0 ? ['none']
    : p.cooking_tools.map((t) => VALUE_TO_TOOL[t]).filter(Boolean);
  return {
    period: monthsToPeriod(p.living_months) ?? fallback.period,
    goal: PRIORITY_TO_GOAL[p.priority] ?? fallback.goal,
    tools: tools ?? fallback.tools,
    cookDays: p.cooking_days_per_week ?? fallback.cookDays,
    budget: p.monthly_budget_krw ?? fallback.budget,
    region: p.region_name ?? fallback.region ?? '',
  };
}
