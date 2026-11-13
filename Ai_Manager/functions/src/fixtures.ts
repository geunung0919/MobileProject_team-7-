// 샘플 페르소나 (samples.ts, eval.ts 공용)
import { EmergencyFaq, InventoryItem, Profile, ReportInput, WeeklyInput } from "./types";

export const today = "2026-11-05";
export const profile: Profile = {
  living_period: "under_6m",
  priority: "save_money",
  cooking_tools: ["microwave"],
  cooking_days_per_week: 4,
  monthly_budget_krw: 500000,
  initial_inventory_state: "empty",
};
const empty = { budget: null, expenses: [], inventory: [], usage_logs: [], routines: [], routine_logs: [] };

export const personas: Record<string, ReportInput> = {
  예산초과형: {
    ...empty,
    today,
    profile,
    budget: { year_month: "2026-11", total_budget: 250000, food_budget: 100000 },
    expenses: [
      { payment_date: "2026-11-01T12:10:00+09:00", category: "식비", total_amount: 18000 },
      { payment_date: "2026-11-02T19:30:00+09:00", category: "식비", total_amount: 52000 },
      { payment_date: "2026-11-03T09:00:00+09:00", category: "교통비", total_amount: 10000 },
      { payment_date: "2026-11-04T20:00:00+09:00", category: "식비", total_amount: 30000 },
      { payment_date: "2026-10-02T12:00:00+09:00", category: "식비", total_amount: 40000 },
    ],
    inventory: [{ item_name: "달걀", expiry_date: "2026-11-20" }],
  },
  낭비형: {
    ...empty,
    today,
    profile: { ...profile, priority: "reduce_waste" },
    expenses: [{ payment_date: "2026-11-02T18:00:00+09:00", category: "식비", total_amount: 30000 }],
    inventory: [
      { item_name: "우유", expiry_date: "2026-11-06" },
      { item_name: "두부", expiry_date: "2026-11-05" },
      { item_name: "상추", expiry_date: "2026-11-02" },
    ],
    usage_logs: [
      { used_quantity: 1, used_at: "2026-10-28T20:00:00+09:00", source: "폐기" },
      { used_quantity: 1, used_at: "2026-11-01T20:00:00+09:00", source: "폐기" },
      { used_quantity: 1, used_at: "2026-11-03T20:00:00+09:00", source: "요리" },
    ],
  },
  // 폐기 기록 없이 임박 재료만 3개 (개수 표현 검증용)
  임박재료형: {
    ...empty,
    today,
    profile: { ...profile, priority: "reduce_waste" },
    expenses: [{ payment_date: "2026-11-02T18:00:00+09:00", category: "식비", total_amount: 30000 }],
    inventory: [
      { item_name: "우유", expiry_date: "2026-11-06" },
      { item_name: "두부", expiry_date: "2026-11-05" },
      { item_name: "대파", expiry_date: "2026-11-07" },
    ],
  },
  루틴부진형: {
    ...empty,
    today,
    profile: { ...profile, priority: "build_habit" },
    expenses: [{ payment_date: "2026-11-02T18:00:00+09:00", category: "생활비", total_amount: 12000 }],
    routines: [
      { routine_id: "r1", title: "환기", repeat_type: "매일" },
      { routine_id: "r2", title: "분리수거", repeat_type: "매주", repeat_days: ["화", "금"] },
    ],
    routine_logs: [{ routine_id: "r1", target_date: "2026-11-04", completed: true }],
  },
  콜드스타트: { ...empty, today, profile },
};

// 형식 확인용 예시 FAQ — 실제 안내문이 아니며, 실제 콘텐츠는 공식 자료로 검증 후 verified로 등록해야 함
export const sampleFaqs: EmergencyFaq[] = [
  {
    faq_id: "gas-smell",
    title: "가스 냄새가 날 때",
    category: "가스",
    keywords: ["가스", "냄새", "누출", "밸브"],
    situation: "집 안에서 가스 냄새가 나는 상황입니다.",
    steps: ["가스 밸브를 잠근다", "창문과 문을 열어 환기한다", "밖으로 대피한 뒤 도시가스 회사나 119에 연락한다"],
    cautions: ["전등·환풍기 스위치나 라이터를 사용하지 않는다"],
    contacts: [{ name: "소방·구급", number: "119" }],
    is_urgent: true,
    source: { org: "(공식 기관명)", title: "(자료 제목)", checked_at: "2026-11-06" },
    status: "verified",
    updated_at: "2026-11-06T00:00:00+09:00",
  },
  {
    faq_id: "power-outage",
    title: "정전이 됐을 때",
    category: "전기",
    keywords: ["정전", "전기", "차단기", "두꺼비집"],
    situation: "집 안 전기가 갑자기 나간 상황입니다.",
    steps: ["차단기가 내려갔는지 확인한다", "전자제품 전원을 끄거나 플러그를 뽑는다", "건물 전체가 정전이면 관리사무소에 문의한다"],
    cautions: [],
    contacts: [],
    is_urgent: false,
    source: { org: "(공식 기관명)", title: "(자료 제목)", checked_at: "2026-11-06" },
    status: "verified",
    updated_at: "2026-11-06T00:00:00+09:00",
  },
];

// AI 레시피 테스트용 재고 (today = 2026-11-05 기준: 두부 D-1, 대파 D-2 임박 · 우유는 소비기한 지남 → 추천에서 제외돼야 함)
export const recipeInventory: InventoryItem[] = [
  { inventory_id: "inv_tofu", item_name: "두부", quantity: 1, unit: "모", expiry_date: "2026-11-06" },
  { inventory_id: "inv_egg", item_name: "달걀", quantity: 4, unit: "개", expiry_date: "2026-11-20" },
  { inventory_id: "inv_scallion", item_name: "대파", quantity: 1, unit: "대", expiry_date: "2026-11-07" },
  { inventory_id: "inv_milk", item_name: "우유", quantity: 500, unit: "ml", expiry_date: "2026-11-03" },
  { inventory_id: "inv_kimchi", item_name: "김치", quantity: null, unit: null, expiry_date: null },
];

// 주간 리포트 테스트용: today = 2026-11-05(목) → 지난주 = 10-26(월) ~ 11-01(일), 비교 = 10-19 ~ 10-25
export const weeklyInput: WeeklyInput = {
  week_start: "2026-10-26",
  profile,
  expenses: [
    { payment_date: "2026-10-27T12:00:00+09:00", category: "식비", total_amount: 20000 },
    { payment_date: "2026-10-30T19:00:00+09:00", category: "식비", total_amount: 32000 },
    { payment_date: "2026-11-01T09:00:00+09:00", category: "교통비", total_amount: 10000 },
    { payment_date: "2026-10-20T12:00:00+09:00", category: "식비", total_amount: 50000 },
    { payment_date: "2026-10-24T15:00:00+09:00", category: "쇼핑비", total_amount: 30000 },
  ],
  usage_logs: [
    { used_quantity: 1, used_at: "2026-10-28T20:00:00+09:00", source: "요리" },
    { used_quantity: 1, used_at: "2026-10-31T20:00:00+09:00", source: "요리" },
    { used_quantity: 1, used_at: "2026-10-29T20:00:00+09:00", source: "폐기" },
  ],
  routines: [
    { routine_id: "r1", title: "환기", repeat_type: "매일" },
    { routine_id: "r2", title: "분리수거", repeat_type: "매주", repeat_days: ["화", "금"] },
  ],
  routine_logs: [
    ...["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-30", "2026-11-01"].map((d) => ({ routine_id: "r1", target_date: d, completed: true })),
    { routine_id: "r2", target_date: "2026-10-27", completed: true },
  ],
};

// 앱(UI) 형식 그대로의 Firestore 문서 예시 (team-project 더미 데이터 기준) — adapters.ts 변환 확인용
export const uiDocs = {
  transactions: [
    {
      id: "t1",
      data: {
        title: "이마트 성수점", amount: 48500, date: "2026-11-05", category: "영수증", source: "receipt",
        items: [
          { name: "서울우유 1L", unitPrice: 2800, quantity: 2, inFridge: true },
          { name: "무항생제 달걀 15구", unitPrice: 7900, quantity: 1, inFridge: true },
          { name: "햇쌀 4kg", unitPrice: 18900, quantity: 1, inFridge: false },
        ],
      },
    },
    { id: "t2", data: { title: "오늘의 식탁", amount: 12000, date: "2026-11-05", category: "식비" } },
    { id: "t3", data: { title: "스타벅스", amount: 5500, date: "2026-11-04", category: "카페·간식" } },
    { id: "t4", data: { title: "올리브영", amount: 23900, date: "2026-11-04", category: "생활용품" } },
    { id: "bad", data: { title: "금액 없음", date: "2026-11-04" } },
  ],
  fridgeItems: [
    { id: "f1", data: { name: "우유", quantity: "1개 · 1L", amount: 1, unit: "개", detail: "1L", expiry: "2026-11-05" } },
    { id: "f2", data: { name: "두부", quantity: "1모 · 300g", amount: 1, unit: "모", expiry: "2026-11-06" } },
    { id: "f5", data: { name: "달걀", quantity: "6개", amount: 6, unit: "개", expiry: "2026-11-15" } },
  ],
  routines: [
    { id: "r1", data: { title: "일어나서 물 한 잔 마시기", time: "07:00", doneToday: true } },
    { id: "r2", data: { title: "창문 열고 환기하기", time: "07:30", doneToday: false } },
    { id: "r3", data: { title: "저녁 먹고 설거지하기", time: "19:00", doneToday: false } },
  ],
  budget: { budget: 1000000 },
};
