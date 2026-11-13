// 필드명은 설계 문서(APPENDIX A·D)의 snake_case 기준. 최종 키 형식은 팀 API Contract 확정 시 통일.

export type InitialInventoryState = "not_entered" | "empty" | "needs_registration";
export type ExpenseCategory = "식비" | "교통비" | "쇼핑비" | "생활비" | "기타";

// PROFILE (30초 자취 진단) — 모든 항목은 비워 둘 수 있으므로 null 허용. 정리는 profile.ts의 normalizeProfile.
// monthly_budget_krw는 '목표'이고 실제 예산은 BUDGET
export type LivingPeriod = "before" | "under_6m" | "under_1y" | "over_1y"; // 시작 전 / 6개월 미만 / 1년 미만 / 1년 이상
export interface Profile {
  living_period: LivingPeriod | null;
  priority: "save_money" | "reduce_waste" | "build_habit" | null;
  cooking_tools: string[]; // 아무것도 안 고르면 [] = 도구 없음
  cooking_days_per_week: number | null; // 0~7
  monthly_budget_krw: number | null;
  initial_inventory_state: InitialInventoryState | null;
}

// BUDGET (user_id + year_month 당 1건)
export interface Budget {
  year_month: string; // 예: 2026-10
  total_budget: number;
  food_budget?: number | null;
}

// EXPENSE (영수증 1건)
export interface Expense {
  payment_date: string; // YYYY-MM-DD 또는 ISO 8601 (앞 10자리를 날짜로 사용)
  category: string; // 앱의 카테고리 이름 그대로 (식료품, 카페·간식, 영수증 …)
  total_amount: number;
  food_amount?: number; // 식비로 볼 금액 (adapters.ts가 계산, 없으면 category가 '식비'일 때 전액)
  store?: string;
}

// INVENTORY / INVENTORY_USAGE_LOG
export interface InventoryItem {
  inventory_id?: string; // Firestore 문서 id (로드할 때 채움) — 요리 후 차감 시 3모듈이 사용
  item_name: string;
  quantity?: number | null;
  unit?: string | null; // 예: 개, 모, g, ml (3모듈과 확정 필요)
  purchase_date?: string | null;
  expiry_date?: string | null; // OCR이 추출하지 않으므로 null일 수 있음
}
export interface UsageLog {
  used_quantity: number;
  used_at: string;
  source: "요리" | "폐기";
}

// ROUTINE / ROUTINE_LOG
export interface Routine {
  routine_id: string;
  title: string;
  repeat_type: string; // 매일 | 매주 | 매월 | 특정 요일 (저장 값은 루틴 담당과 확인 필요)
  repeat_days?: string[]; // 예: ["화", "금"]
  is_critical?: boolean;
}
export interface RoutineLog {
  routine_id: string;
  target_date: string;
  completed: boolean;
}

export interface ReportInput {
  today: string; // YYYY-MM-DD (KST)
  profile: Profile;
  budget: Budget | null;
  expenses: Expense[];
  inventory: InventoryItem[];
  usage_logs: UsageLog[];
  routines: Routine[];
  routine_logs: RoutineLog[];
  routine_tracking?: "daily" | "today_only"; // today_only = 오늘 완료 여부만 있음 (기본 daily)
  usage_tracking?: boolean; // false = 요리/폐기 기록을 저장하지 않음 (기본 true)
}

export type Goal = "save_money" | "reduce_waste" | "build_habit" | "unknown";
export type Facts = Record<string, string | number | string[] | Record<string, number> | null>;

export interface Insight {
  code: "COLD_START" | "BUDGET_PACE" | "FOOD_OVER" | "EXPIRING" | "WASTE" | "STOCK_EMPTY" | "ROUTINE_LOW";
  priority: number;
  facts: Facts;
}

// 규칙 기반 분석 결과 = AI에 전달하는 '요약 데이터' (원본 기록은 보내지 않음)
export interface AnalysisResult {
  cold_start: boolean;
  goal: Goal;
  summary: { expense: Facts; inventory: Facts; routine: Facts };
  insights: Insight[];
}

// AI_REPORT 저장 형태 (설계 문서의 '정해진 형식의 AI 결과')
export interface AiReport {
  today_message: string;
  expense_summary: string;
  inventory_summary: string;
  routine_summary: string;
  actions: string[]; // 저장 형태(JSON 배열 vs 별도 구조)는 팀 DB 통합 시 확정
}

// /ai/chat 대화 한 턴 (대화 내용은 서버에 저장하지 않음 — 클라이언트가 최근 대화를 함께 보냄)
export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

// ---------- 주간 리포트 (지난주 월~일) ----------
export interface WeeklyInput {
  week_start: string; // 지난주 월요일 YYYY-MM-DD
  profile: Profile;
  expenses: Expense[]; // 지난주 + 그 전 주
  usage_logs: UsageLog[];
  routines: Routine[];
  routine_logs: RoutineLog[];
  routine_tracking?: "daily" | "today_only";
  usage_tracking?: boolean;
}

// 코드가 계산한 주간 수치 (화면에 그대로 표시, AI는 이 숫자만 인용)
export interface WeeklyStats {
  week_start: string;
  week_end: string;
  spent_total: number;
  spent_prev_week: number;
  change_percent: number | null; // 전주 대비 (전주 지출이 0이면 null)
  by_category: Record<string, number>;
  cooked_count: number | null; // 요리로 재고 사용 (기록 안 하면 null)
  wasted_count: number | null; // 폐기 (기록 안 하면 null)
  routine_due: number | null; // 날짜별 루틴 기록이 없으면 null
  routine_done: number | null;
  routine_percent: number | null;
}

export interface WeeklyAnalysis {
  no_data: boolean;
  goal: Goal;
  stats: WeeklyStats;
  good: string[]; // 잘한 점 코드 (예: SPEND_DOWN)
  improve: string[]; // 아쉬운 점 코드 (예: WASTE)
}

// AI가 쓰는 부분 (문장만)
export interface WeeklyText {
  weekly_summary: string;
  good_point: string;
  improve_point: string;
  next_week_goal: string;
}

// ---------- AI 레시피 (양민혁 님과 협업 — 임시 형식, 3모듈과 확정 필요) ----------
// 요청: httpsCallable("recommendRecipes")({ max_minutes?, servings?, count?, must_use? })
export interface RecipeOptions {
  max_minutes: number; // 조리시간 상한 (기본 30)
  servings: number; // 기본 1인분
  count: number; // 추천 개수 1~3 (기본 2)
  must_use: string[]; // 사용자가 고른 '이 재료로' 목록 (재료 이름)
}

// AI에 보내는 조건 (원본 재고 그대로가 아니라 필요한 필드만, 소비기한 지난 재료는 제외)
export interface RecipeContext {
  today: string;
  servings: number;
  max_minutes: number;
  count: number;
  tools: { code: string; label: string }[];
  inventory: { name: string; quantity: number | null; unit: string | null; d_day: number | null; expiring: boolean }[];
  must_use: string[];
  pantry: string[]; // 재고에 없어도 쓸 수 있는 기본 양념
  expired_do_not_use: string[]; // 소비기한이 지나 쓰면 안 되는 재료
  max_missing: number; // 냉장고에 없는 재료(장 봐야 하는 재료) 허용 개수
}

export interface RecipeIngredient {
  name: string;
  from_inventory: boolean; // true = 냉장고 재료
  missing: boolean; // true = 냉장고에 없는 재료 (앱의 '필요한 재료'). from_inventory·missing 둘 다 false면 기본 양념
  inventory_id: string | null; // 요리 후 차감 화면에서 사용
  quantity: number | null; // 추천 사용량 (실제 차감은 사용자가 확인·수정한 값으로)
  unit: string | null;
  amount_text: string; // 화면 표시용 (코드가 생성)
}

export interface Recipe {
  id: string; // 응답 안에서만 쓰는 id (레시피는 저장하지 않음)
  title: string;
  difficulty: "아주 쉬움" | "쉬움" | "보통";
  icon: string; // 앱 아이콘 이름 (MaterialCommunityIcons, 코드가 정함)
  minutes: number;
  servings: number;
  tools: string[];
  tool_labels: string[];
  ingredients: RecipeIngredient[];
  steps: string[];
  uses_expiring: string[]; // 임박 재료 중 이 레시피가 쓰는 것 (코드가 계산)
}

// 비상매뉴얼 FAQ (emergency_faq 컬렉션 제안 형식 — 필드는 김근형 님과 확정 필요)
export interface EmergencyFaq {
  faq_id: string;
  title: string;
  category: string;
  keywords: string[];
  situation: string;
  steps: string[]; // 배열 순서 = 실행 순서
  cautions?: string[];
  contacts?: { name: string; number: string }[];
  is_urgent: boolean;
  source: { org: string; title: string; url?: string; checked_at?: string };
  status: "verified" | "draft";
  updated_at: string;
}
