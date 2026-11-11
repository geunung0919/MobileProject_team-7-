// PROFILE 정리(순수 함수): '30초 자취 진단' 화면에서 저장한 값을 서버가 쓰는 형식으로 맞춘다.
// - 모든 항목은 비워 둘 수 있다 → 없으면 null (진단을 아예 안 했어도 에러 없이 동작)
// - 화면의 한글 선택지와 코드 값 둘 다 받는다 (저장 형식이 확정되면 여기만 수정)
// - 조리도구를 하나도 안 고르면 [] = 도구 없음 (팀 결정)
import { InitialInventoryState, LivingPeriod, Profile } from "./types";

const LIVING_PERIOD: Record<string, LivingPeriod> = {
  before: "before", "시작 전": "before",
  under_6m: "under_6m", "6개월 미만": "under_6m",
  under_1y: "under_1y", "1년 미만": "under_1y",
  over_1y: "over_1y", "1년 이상": "over_1y",
};
export const LIVING_PERIOD_LABEL: Record<LivingPeriod, string> = {
  before: "자취 시작 전",
  under_6m: "자취 6개월 미만",
  under_1y: "자취 1년 미만",
  over_1y: "자취 1년 이상",
};

const PRIORITY: Record<string, NonNullable<Profile["priority"]>> = {
  save_money: "save_money", "생활비 절약": "save_money",
  reduce_waste: "reduce_waste", "낭비 줄이기": "reduce_waste", "식재료 낭비 줄이기": "reduce_waste",
  build_habit: "build_habit", "습관 만들기": "build_habit", "생활 습관 만들기": "build_habit",
};

// 진단 화면의 조리도구 4가지
const TOOLS: Record<string, string> = {
  microwave: "microwave", 전자레인지: "microwave",
  stove: "stove", "가스·인덕션": "stove", 가스레인지: "stove", 인덕션: "stove",
  rice_cooker: "rice_cooker", 밥솥: "rice_cooker", 전기밥솥: "rice_cooker",
  air_fryer: "air_fryer", 에어프라이어: "air_fryer",
};

const INVENTORY_STATE: Record<string, InitialInventoryState> = {
  not_entered: "not_entered", "나중에 입력": "not_entered",
  empty: "empty", "비어 있어요": "empty",
  needs_registration: "needs_registration", "재료가 있어요": "needs_registration",
};

const pickStr = <T>(map: Record<string, T>, v: unknown): T | null => (typeof v === "string" && map[v.trim()]) || null;
const numberOrNull = (v: unknown, min: number, max: number): number | null => {
  const n = typeof v === "string" ? Number(v.replace(/[,\s원]/g, "")) : v;
  return typeof n === "number" && Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : null;
};

export function normalizeProfile(raw: unknown): Profile {
  const p = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const tools = Array.isArray(p.cooking_tools) ? p.cooking_tools : [];
  return {
    living_period: pickStr(LIVING_PERIOD, p.living_period),
    priority: pickStr(PRIORITY, p.priority),
    cooking_tools: [...new Set(tools.map((t) => pickStr(TOOLS, t)).filter((t): t is string => !!t))],
    cooking_days_per_week: numberOrNull(p.cooking_days_per_week, 0, 7),
    monthly_budget_krw: numberOrNull(p.monthly_budget_krw, 1, 100_000_000),
    initial_inventory_state: pickStr(INVENTORY_STATE, p.initial_inventory_state),
  };
}
