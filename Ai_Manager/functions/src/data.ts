import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { addDays } from "./analyze";
import { normalizeProfile } from "./profile";
import {
  compact, DATA_SOURCE, FIELDS, toBudget, toExpense, toInventoryItem, toRoutine, toRoutineLog, todayLogsFromRoutines, toUsageLog,
} from "./adapters";
import { EmergencyFaq, InventoryItem, Profile, ReportInput, WeeklyInput } from "./types";

if (getApps().length === 0) initializeApp();
export let db = getFirestore();
// 테스트 전용: Emulator 없이 메모리 DB로 전체 흐름을 돌릴 때만 사용 (scripts/e2e.ts)
export function useDbForTest(fake: unknown) {
  db = fake as FirebaseFirestore.Firestore;
}

// Firestore 경로. 컬렉션 이름은 앱 저장소(AppDataContext)의 이름을 따른 가정 → 팀에서 확정되면 여기만 수정
export const PATHS = {
  profile: (uid: string) => `users/${uid}`, // 문서의 'profile' 필드 (30초 자취 진단 결과)
  budgets: (uid: string) => `users/${uid}/budgets`, // 문서 id = YYYY-MM, { budget } 또는 { total_budget }
  expenses: (uid: string) => `users/${uid}/transactions`, // 앱의 소비 내역
  inventory: (uid: string) => `users/${uid}/fridgeItems`, // 앱의 식재료
  usageLogs: (uid: string) => `users/${uid}/inventory_usage_logs`, // 아직 앱에서 저장 안 함 (DATA_SOURCE.usageLogs)
  routines: (uid: string) => `users/${uid}/routines`,
  routineLogs: (uid: string) => `users/${uid}/routine_logs`, // 아직 앱에서 저장 안 함 (DATA_SOURCE.routineDailyLogs)
  aiReports: (uid: string) => `users/${uid}/ai_reports`, // 문서 id = report_date
  weeklyReports: (uid: string) => `users/${uid}/ai_weekly_reports`, // 문서 id = week_start (월요일)
  emergencyFaq: "emergency_faq", // 사용자와 무관한 공용 콘텐츠
  aiUsage: (uid: string) => `users/${uid}/ai_usage`, // 문서 id = {기능}_{날짜}, 사용 횟수만 저장
};

export const todayKST = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
type Snap = FirebaseFirestore.QuerySnapshot;
const raws = (snap: Snap) => snap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }));
const empty = Promise.resolve(null);

const toExpenses = (snap: Snap) => compact(raws(snap).map((d) => toExpense(d.data)));
const toInventory = (snap: Snap) => compact(raws(snap).map((d) => toInventoryItem(d.id, d.data)));
const toRoutines = (snap: Snap) => compact(raws(snap).map((d) => toRoutine(d.id, d.data)));
const toUsage = (snap: Snap | null) => (snap ? compact(raws(snap).map((d) => toUsageLog(d.data))) : []);
// 날짜별 루틴 기록이 있으면 그걸, 없으면 오늘 완료 여부(doneToday)로 오늘 기록만
const toRoutineLogs = (logSnap: Snap | null, routineSnap: Snap, today: string) =>
  logSnap ? compact(raws(logSnap).map((d) => toRoutineLog(d.data))) : todayLogsFromRoutines(raws(routineSnap), today);
const tracking = () => ({
  routine_tracking: DATA_SOURCE.routineDailyLogs ? ("daily" as const) : ("today_only" as const),
  usage_tracking: DATA_SOURCE.usageLogs,
});

// 날짜 필드는 "YYYY-MM-DD" 문자열(또는 ISO 8601)로 저장되어 있다고 가정 (Timestamp면 쿼리 수정 필요)
export async function loadInput(uid: string, today: string): Promise<ReportInput> {
  // 진단을 안 했거나 일부만 입력해도 동작 (없는 항목은 null)
  const profile = normalizeProfile((await db.doc(PATHS.profile(uid)).get()).get("profile"));

  const month = today.slice(0, 7);
  const prevMonthStart = addDays(`${month}-01`, -1).slice(0, 7) + "-01"; // 지난달 같은 기간 비교용
  const [budgetSnap, expSnap, invSnap, usageSnap, routineSnap, rlogSnap] = await Promise.all([
    db.doc(`${PATHS.budgets(uid)}/${month}`).get(),
    db.collection(PATHS.expenses(uid)).where(FIELDS.expenseDate, ">=", prevMonthStart).get(),
    db.collection(PATHS.inventory(uid)).get(),
    DATA_SOURCE.usageLogs ? db.collection(PATHS.usageLogs(uid)).where(FIELDS.usageDate, ">=", addDays(today, -29)).get() : empty,
    db.collection(PATHS.routines(uid)).get(),
    DATA_SOURCE.routineDailyLogs ? db.collection(PATHS.routineLogs(uid)).where(FIELDS.routineLogDate, ">=", addDays(today, -6)).get() : empty,
  ]);

  return {
    today,
    profile,
    budget: toBudget(budgetSnap.data(), month),
    expenses: toExpenses(expSnap),
    inventory: toInventory(invSnap),
    usage_logs: toUsage(usageSnap),
    routines: toRoutines(routineSnap),
    routine_logs: toRoutineLogs(rlogSnap, routineSnap, today),
    ...tracking(),
  };
}

// 주간 리포트용: 지난주와 그 전 주(비교용) 2주치 기록
export async function loadWeeklyInput(uid: string, weekStart: string, today: string): Promise<WeeklyInput> {
  const profile = normalizeProfile((await db.doc(PATHS.profile(uid)).get()).get("profile"));
  const prevStart = addDays(weekStart, -7);
  const [expSnap, usageSnap, routineSnap, rlogSnap] = await Promise.all([
    db.collection(PATHS.expenses(uid)).where(FIELDS.expenseDate, ">=", prevStart).get(),
    DATA_SOURCE.usageLogs ? db.collection(PATHS.usageLogs(uid)).where(FIELDS.usageDate, ">=", prevStart).get() : empty,
    db.collection(PATHS.routines(uid)).get(),
    DATA_SOURCE.routineDailyLogs ? db.collection(PATHS.routineLogs(uid)).where(FIELDS.routineLogDate, ">=", weekStart).get() : empty,
  ]);
  return {
    week_start: weekStart,
    profile,
    expenses: toExpenses(expSnap),
    usage_logs: toUsage(usageSnap),
    routines: toRoutines(routineSnap),
    routine_logs: toRoutineLogs(rlogSnap, routineSnap, today),
    ...tracking(),
  };
}

// AI 레시피용: PROFILE(조리도구)과 현재 재고만 읽는다
export async function loadRecipeInput(uid: string): Promise<{ profile: Profile; inventory: InventoryItem[] }> {
  const [userSnap, invSnap] = await Promise.all([db.doc(PATHS.profile(uid)).get(), db.collection(PATHS.inventory(uid)).get()]);
  return { profile: normalizeProfile(userSnap.get("profile")), inventory: toInventory(invSnap) };
}

// 기능별 하루 사용 횟수 제한 (비용 보호). 횟수만 저장하고 대화 내용은 저장하지 않는다.
// feature 예: "chat"(자취 매니저 채팅), "emergency"(비상매뉴얼 AI), "report_force"(리포트 재생성)
export async function consumeQuota(uid: string, feature: string, limit: number, today: string): Promise<boolean> {
  const ref = db.doc(`${PATHS.aiUsage(uid)}/${feature}_${today}`);
  return db.runTransaction(async (tx) => {
    const n = ((await tx.get(ref)).get("count") as number | undefined) ?? 0;
    if (n >= limit) return false;
    tx.set(ref, { count: n + 1 }, { merge: true });
    return true;
  });
}

// 비상매뉴얼 FAQ: verified 항목만, 5분간 메모리 캐시 (개인 데이터는 읽지 않음)
let faqCache: { at: number; items: EmergencyFaq[] } | null = null;
export async function loadVerifiedFaqs(): Promise<EmergencyFaq[]> {
  if (faqCache && Date.now() - faqCache.at < 5 * 60_000) return faqCache.items;
  const snap = await db.collection(PATHS.emergencyFaq).where("status", "==", "verified").get();
  const items = snap.docs.map((d) => d.data() as EmergencyFaq);
  faqCache = { at: Date.now(), items };
  return items;
}
