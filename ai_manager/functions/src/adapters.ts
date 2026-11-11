// 앱(UI) 데이터 → 서버 형식 변환. UI 데이터 형식이 바뀌면 이 파일만 고친다.
// 기준: team-project/src/data/README.md · store/AppDataContext.js (camelCase)
//   소비   { id, title, amount, date: "YYYY-MM-DD", category, source, items: [{ name, unitPrice, quantity, inFridge }] }
//   식재료 { id, name, amount(숫자), unit, purchaseDate, expiry, quantity(표시용 글자) }
//   루틴   { id, title, time: "HH:mm", doneToday }
// 서버 형식(snake_case)으로 저장된 문서도 그대로 받는다.
import { Budget, Expense, InventoryItem, Routine, RoutineLog, UsageLog } from "./types";

// 앱이 아직 저장하지 않는 기록. 앱이 저장하게 되면 true로 바꾸면 분석에 자동으로 들어간다.
export const DATA_SOURCE = {
  routineDailyLogs: false, // 루틴의 날짜별 완료 기록 (지금 앱은 '오늘 했는지(doneToday)'만 있음)
  usageLogs: false, // 재고 사용 기록(요리/폐기) (지금 앱은 요리하면 재료를 통째로 지움)
};

// Firestore 쿼리에 쓰는 날짜 필드 이름 (앱 형식 기준)
export const FIELDS = {
  expenseDate: "date",
  usageDate: "used_at",
  routineLogDate: "target_date",
};

// 식비로 보는 카테고리 (앱의 카테고리 이름). '영수증' 지출은 냉장고 보관 품목(inFridge)만 식비로 센다.
export const FOOD_CATEGORIES = ["식비", "식료품", "카페·간식"];

type Raw = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
const first = (...vs: unknown[]) => vs.find((v) => v !== undefined && v !== null);

export function toExpense(raw: Raw): Expense | null {
  const date = str(first(raw.date, raw.payment_date));
  const amount = num(first(raw.amount, raw.total_amount));
  if (!date || amount === null) return null;
  const category = str(raw.category) ?? "기타";

  let food_amount = 0;
  if (FOOD_CATEGORIES.includes(category)) food_amount = amount;
  else if (Array.isArray(raw.items)) {
    for (const it of raw.items as Raw[]) {
      if (it?.inFridge === true) food_amount += (num(it.unitPrice) ?? 0) * (num(it.quantity) ?? 1);
    }
    food_amount = Math.min(food_amount, amount);
  }
  return { payment_date: date, category, total_amount: amount, food_amount, store: str(first(raw.title, raw.store)) ?? undefined };
}

export function toInventoryItem(id: string, raw: Raw): InventoryItem | null {
  const name = str(first(raw.name, raw.item_name));
  if (!name) return null;
  return {
    inventory_id: id,
    item_name: name,
    quantity: num(first(raw.amount, typeof raw.quantity === "number" ? raw.quantity : undefined)), // 앱의 quantity는 표시용 글자
    unit: str(raw.unit),
    purchase_date: str(first(raw.purchaseDate, raw.purchase_date)),
    expiry_date: str(first(raw.expiry, raw.expiry_date)),
  };
}

export function toRoutine(id: string, raw: Raw): Routine | null {
  const title = str(raw.title);
  if (!title) return null;
  return {
    routine_id: str(raw.routine_id) ?? id,
    title,
    repeat_type: str(raw.repeat_type) ?? "매일", // 앱 루틴은 매일 반복
    repeat_days: Array.isArray(raw.repeat_days) ? (raw.repeat_days as string[]) : undefined,
    is_critical: raw.is_critical === true,
  };
}

// 날짜별 기록이 없을 때: 오늘 완료 여부(doneToday)로 오늘 기록만 만든다
export function todayLogsFromRoutines(docs: { id: string; data: Raw }[], today: string): RoutineLog[] {
  return docs
    .filter((d) => typeof d.data.doneToday === "boolean")
    .map((d) => ({ routine_id: str(d.data.routine_id) ?? d.id, target_date: today, completed: d.data.doneToday as boolean }));
}

export function toRoutineLog(raw: Raw): RoutineLog | null {
  const routine_id = str(first(raw.routine_id, raw.routineId));
  const target_date = str(first(raw.target_date, raw.date));
  if (!routine_id || !target_date) return null;
  return { routine_id, target_date, completed: raw.completed === true || raw.done === true };
}

export function toUsageLog(raw: Raw): UsageLog | null {
  const used_at = str(first(raw.used_at, raw.usedAt));
  const source = str(raw.source);
  if (!used_at || (source !== "요리" && source !== "폐기")) return null;
  return { used_at, source, used_quantity: num(first(raw.used_quantity, raw.usedQuantity)) ?? 1 };
}

export function toBudget(raw: Raw | undefined, yearMonth: string): Budget | null {
  if (!raw) return null;
  const total = num(first(raw.total_budget, raw.budget, raw.amount));
  if (total === null || total <= 0) return null;
  return { year_month: yearMonth, total_budget: total, food_budget: num(first(raw.food_budget, raw.foodBudget)) };
}

export const compact = <T>(xs: (T | null)[]) => xs.filter((x): x is T => x !== null);
