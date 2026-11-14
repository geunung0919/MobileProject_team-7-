// 규칙 기반 분석(순수 함수): 원본 기록 → AI에 보낼 '요약 데이터'와 인사이트
// 숫자는 전부 여기서 계산한다. LLM은 이 숫자를 문장으로 옮기기만 한다.
import { AnalysisResult, Facts, Goal, Insight, ReportInput, Routine } from "./types";

// 기준값은 설계 문서상 '추후 확정' → 3모듈·2모듈과 합의되면 여기만 수정
export const EXPIRING_DAYS = 3; // 소비기한 D-0 ~ D-3 = 임박
export const WASTE_ALERT_COUNT = 2; // 최근 30일 폐기 2건 이상이면 알림
export const ROUTINE_LOW_PERCENT = 50; // 최근 7일 완료율 50% 미만이면 알림
export const PACE_MARGIN_PERCENT = 10; // 지출 비율이 기간 경과 비율보다 10%p 이상 높으면 알림

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 날짜 문자열은 YYYY-MM-DD(KST 기준)로 다룬다. ISO 8601 값은 앞 10자리(현지 날짜)를 사용.
const ymd = (s: string) => s.slice(0, 10);
const toUtc = (d: string) => Date.parse(`${ymd(d)}T00:00:00Z`);

export function addDays(date: string, n: number): string {
  const d = new Date(toUtc(date));
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const diffDays = (a: string, b: string) => Math.round((toUtc(a) - toUtc(b)) / 86_400_000);
const daysInMonth = (date: string) => {
  const [y, m] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};
const weekday = (date: string) => WEEKDAYS[new Date(toUtc(date)).getUTCDay()];
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : null);

export function toGoal(priority: string | null | undefined): Goal {
  return priority === "save_money" || priority === "reduce_waste" || priority === "build_habit" ? priority : "unknown";
}

// 반복 일정 로직(Appendix B): 오늘 날짜가 반복 조건에 포함되는가
export function isDue(r: Routine, date: string): boolean {
  switch (r.repeat_type) {
    case "매일":
      return true;
    case "매주":
    case "특정 요일":
      return (r.repeat_days ?? []).includes(weekday(date));
    case "매월":
      return (r.repeat_days ?? []).includes(String(Number(date.slice(8, 10))));
    default:
      return false;
  }
}

export function analyze(input: ReportInput): AnalysisResult {
  const { today, profile, budget } = input;
  const goal = toGoal(profile.priority);
  const month = today.slice(0, 7);
  const dayOfMonth = Number(today.slice(8, 10));

  // ---------- 소비 ----------
  const thisMonth = input.expenses.filter((e) => ymd(e.payment_date).startsWith(month) && ymd(e.payment_date) <= today);
  const prevMonth = addDays(`${month}-01`, -1).slice(0, 7);
  const lastSamePeriod = input.expenses.filter(
    (e) => ymd(e.payment_date).startsWith(prevMonth) && Number(ymd(e.payment_date).slice(8, 10)) <= dayOfMonth
  );
  const sum = (xs: { total_amount: number }[]) => xs.reduce((s, e) => s + (e.total_amount || 0), 0);

  const monthTotal = sum(thisMonth);
  const lastTotal = sum(lastSamePeriod);
  const byCategory: Record<string, number> = {};
  for (const e of thisMonth) byCategory[e.category] = (byCategory[e.category] ?? 0) + (e.total_amount || 0);
  const foodSpent = thisMonth.reduce((s, e) => s + (e.food_amount ?? (e.category === "식비" ? e.total_amount || 0 : 0)), 0);

  const daysLeft = daysInMonth(today) - dayOfMonth + 1; // 오늘 포함
  const remaining = budget ? budget.total_budget - monthTotal : null;
  const expense: Facts = {
    month_total: monthTotal,
    by_category: byCategory,
    budget_total: budget?.total_budget ?? null,
    remaining_budget: remaining,
    spent_percent: budget ? pct(monthTotal, budget.total_budget) : null,
    elapsed_percent: pct(dayOfMonth, daysInMonth(today)),
    days_left: daysLeft,
    daily_allowance: remaining !== null && remaining > 0 ? Math.floor(remaining / daysLeft) : null,
    last_month_same_period: lastTotal,
    change_percent: lastTotal > 0 ? Math.round(((monthTotal - lastTotal) / lastTotal) * 100) : null,
    food_spent: foodSpent,
    food_budget: budget?.food_budget ?? null,
    monthly_target_krw: profile.monthly_budget_krw ?? null, // 진단의 '목표' (BUDGET과 별개)
  };

  // ---------- 재고 ----------
  const withDays = input.inventory
    .filter((i) => i.expiry_date)
    .map((i) => ({ name: i.item_name, d: diffDays(i.expiry_date!, today) }))
    .sort((a, b) => a.d - b.d);
  const expiring = withDays.filter((x) => x.d >= 0 && x.d <= EXPIRING_DAYS);
  const expired = withDays.filter((x) => x.d < 0);
  const usageTracked = input.usage_tracking !== false; // 기록을 안 하면 0이 아니라 null ('폐기 0건' 같은 틀린 말 방지)
  const wasteCount = usageTracked ? input.usage_logs.filter((l) => l.source === "폐기").length : null;
  const cookCount = usageTracked ? input.usage_logs.filter((l) => l.source === "요리").length : null;
  const inventory: Facts = {
    item_count: input.inventory.length,
    expiring_count: expiring.length,
    expiring_items: expiring.map((x) => `${x.name}(D-${x.d})`),
    expired_count: expired.length,
    expired_items: expired.map((x) => x.name),
    waste_count_30d: wasteCount,
    cook_count_30d: cookCount,
  };

  // ---------- 루틴 (최근 7일, 오늘 포함. 날짜별 기록이 없으면 오늘만) ----------
  const todayOnly = input.routine_tracking === "today_only";
  let due = 0;
  let done = 0;
  for (let i = todayOnly ? 0 : 6; i >= 0; i--) {
    const date = addDays(today, -i);
    for (const r of input.routines) {
      if (!isDue(r, date)) continue;
      due++;
      if (input.routine_logs.some((l) => l.routine_id === r.routine_id && l.target_date === date && l.completed)) done++;
    }
  }
  const doneToday = new Set(input.routine_logs.filter((l) => l.target_date === today && l.completed).map((l) => l.routine_id));
  const todayDue = input.routines.filter((r) => isDue(r, today));
  const routine: Facts = {
    routine_count: input.routines.length,
    today_routines: todayDue.map((r) => r.title),
    today_done: todayDue.filter((r) => doneToday.has(r.routine_id)).length,
    today_remaining: todayDue.filter((r) => !doneToday.has(r.routine_id)).map((r) => r.title),
    due_7d: todayOnly ? null : due,
    done_7d: todayOnly ? null : done,
    completion_percent: todayOnly ? null : pct(done, due),
  };

  // ---------- 인사이트 ----------
  const cold_start =
    input.expenses.length === 0 && input.inventory.length === 0 && input.routines.length === 0 && input.usage_logs.length === 0;

  const insights: Insight[] = [];
  const boost = (codes: Insight["code"][]) => (code: Insight["code"]) =>
    goal !== "unknown" && codes.includes(code) ? 2 : 0;
  const goalBoost = boost(
    goal === "save_money" ? ["BUDGET_PACE", "FOOD_OVER"] : goal === "reduce_waste" ? ["EXPIRING", "WASTE", "STOCK_EMPTY"] : ["ROUTINE_LOW"]
  );
  const add = (code: Insight["code"], base: number, facts: Facts) => insights.push({ code, priority: base + goalBoost(code), facts });

  if (cold_start) {
    add("COLD_START", 10, { monthly_target_krw: profile.monthly_budget_krw ?? null });
  } else {
    if (budget && remaining !== null) {
      const spentP = pct(monthTotal, budget.total_budget) ?? 0;
      const elapsedP = pct(dayOfMonth, daysInMonth(today)) ?? 0;
      if (remaining < 0 || spentP >= elapsedP + PACE_MARGIN_PERCENT) {
        add("BUDGET_PACE", remaining < 0 ? 5 : 3, {
          month_total: monthTotal,
          budget_total: budget.total_budget,
          remaining_budget: remaining,
          spent_percent: spentP,
          elapsed_percent: elapsedP,
          days_left: daysLeft,
          daily_allowance: expense.daily_allowance,
        });
      }
    }
    if (budget?.food_budget && foodSpent >= budget.food_budget) {
      add("FOOD_OVER", 3, { food_spent: foodSpent, food_budget: budget.food_budget, food_percent: pct(foodSpent, budget.food_budget) });
    }
    if (expiring.length > 0 || expired.length > 0) {
      add("EXPIRING", expiring.some((x) => x.d === 0) ? 5 : 4, {
        expiring_count: expiring.length,
        expiring_items: inventory.expiring_items,
        expired_count: expired.length,
        expired_items: inventory.expired_items,
      });
    }
    if (wasteCount !== null && wasteCount >= WASTE_ALERT_COUNT) add("WASTE", 3, { waste_count_30d: wasteCount, cook_count_30d: cookCount });
    // 요리 일수를 모르면(null) 재료 등록을 권하는 쪽으로
    if (input.inventory.length === 0 && (profile.cooking_days_per_week ?? 1) > 0) add("STOCK_EMPTY", 1, { item_count: 0 });
    const rate = todayOnly ? null : pct(done, due); // 오늘 하루치만으로는 '부진'을 판단하지 않음
    if (rate !== null && rate < ROUTINE_LOW_PERCENT) {
      add("ROUTINE_LOW", 2, { due_7d: due, done_7d: done, completion_percent: rate, today_routines: routine.today_routines });
    }
  }
  insights.sort((a, b) => b.priority - a.priority);

  return { cold_start, goal, summary: { expense, inventory, routine }, insights };
}
