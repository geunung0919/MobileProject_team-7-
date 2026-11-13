// 전체 흐름 테스트: 로그인 → 앱(UI) 형식 데이터 입력 → 함수 6개 호출 → 통과/실패 출력
//
//   로컬 모드 (Emulator 없이, 메모리 DB):  npm run e2e:local
//   Emulator 모드 (진짜 Firebase Emulator): npm run e2e     ← scripts/run-e2e.mjs 가 아래를 대신 실행
//      firebase emulators:exec --only auth,firestore,functions "npx tsx scripts/e2e.ts --emulator"
//
// AI는 항상 Mock (API 한도 사용 X). 정상 응답(LLM_MOCK=1)과 AI 실패(LLM_MOCK=fail) 두 경우를 모두 확인한다.
import { addDays } from "../src/analyze";
import { sampleFaqs } from "../src/fixtures";
import { lastWeekStart } from "../src/weekly";

const EMULATOR = process.argv.includes("--emulator");
const PROJECT = "demo-jachi";
const REGION = "asia-northeast3";
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());

type Result = { ok: true; data: any } | { ok: false; code: string; message: string };
interface Harness {
  newUser(): Promise<string | null>; // uid
  put(path: string, data: Record<string, unknown>): Promise<void>;
  read(path: string): Promise<Record<string, unknown> | undefined>;
  call(name: string, data: unknown, uid: string | null): Promise<Result>;
}

// ---------------------------------------------------------------------------
// 로컬 모드: 메모리 DB + 함수를 직접 실행
// ---------------------------------------------------------------------------
async function localHarness(): Promise<Harness> {
  process.env.ANTHROPIC_API_KEY ??= "dummy-for-local";
  const { FakeFirestore } = await import("./fakeFirestore");
  const data = await import("../src/data");
  const fake = new FakeFirestore();
  data.useDbForTest(fake);
  const fns = (await import("../src/index")) as Record<string, any>;
  let n = 0;
  return {
    newUser: async () => `local-user-${++n}`,
    put: async (p, d) => fake.put(p, d),
    read: async (p) => fake.read(p),
    call: async (name, payload, uid) => {
      try {
        const out = await fns[name].run({ data: payload, auth: uid ? { uid, token: {} } : undefined, rawRequest: {} });
        return { ok: true, data: out };
      } catch (e: any) {
        return { ok: false, code: String(e.code ?? "internal"), message: String(e.message) };
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Emulator 모드: 진짜 Auth/Firestore/Functions Emulator에 HTTP로 호출
// ---------------------------------------------------------------------------
async function emulatorHarness(): Promise<Harness> {
  const { initializeApp } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  const db = getFirestore(initializeApp({ projectId: PROJECT }, "e2e"));
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";
  const fnHost = process.env.FUNCTIONS_EMULATOR_HOST ?? "127.0.0.1:5001";
  const tokens = new Map<string, string>();
  return {
    newUser: async () => {
      const r = await fetch(`http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnSecureToken: true }),
      });
      const j: any = await r.json();
      tokens.set(j.localId, j.idToken);
      return j.localId;
    },
    put: async (p, d) => void (await db.doc(p).set(d)),
    read: async (p) => (await db.doc(p).get()).data(),
    call: async (name, payload, uid) => {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (uid) headers.Authorization = `Bearer ${tokens.get(uid)}`;
      const r = await fetch(`http://${fnHost}/${PROJECT}/${REGION}/${name}`, { method: "POST", headers, body: JSON.stringify({ data: payload }) });
      const j: any = await r.json();
      if (j.error) return { ok: false, code: String(j.error.status).toLowerCase().replace(/_/g, "-"), message: j.error.message };
      return { ok: true, data: j.result };
    },
  };
}

// ---------------------------------------------------------------------------
// 테스트 데이터 (앱 형식 그대로)
// ---------------------------------------------------------------------------
async function seedUser(h: Harness, uid: string) {
  const u = `users/${uid}`;
  const lw = lastWeekStart(today);
  await h.put(u, {
    profile: { living_period: "6개월 미만", priority: "생활비 절약", cooking_tools: ["전자레인지"], cooking_days_per_week: 3, monthly_budget_krw: "500,000", initial_inventory_state: "재료가 있어요" },
  });
  await h.put(`${u}/budgets/${today.slice(0, 7)}`, { budget: 300000 });
  const tx = [
    { id: "t-receipt", title: "이마트", amount: 48500, date: today, category: "영수증", source: "receipt", items: [{ name: "두부", unitPrice: 1800, quantity: 1, inFridge: true }, { name: "세제", unitPrice: 46700, quantity: 1, inFridge: false }] },
    { id: "t-lunch", title: "학식", amount: 6000, date: today, category: "식비" },
    { id: "t-lw1", title: "편의점", amount: 7000, date: addDays(lw, 1), category: "식비" },
    { id: "t-lw2", title: "카페", amount: 5000, date: addDays(lw, 3), category: "카페·간식" },
    { id: "t-pw", title: "마트", amount: 20000, date: addDays(lw, -3), category: "식료품" },
  ];
  for (const { id, ...d } of tx) await h.put(`${u}/transactions/${id}`, d);
  await h.put(`${u}/fridgeItems/f-tofu`, { name: "두부", quantity: "1모", amount: 1, unit: "모", expiry: addDays(today, 1) });
  await h.put(`${u}/fridgeItems/f-egg`, { name: "달걀", quantity: "6개", amount: 6, unit: "개", expiry: addDays(today, 10) });
  await h.put(`${u}/fridgeItems/f-milk`, { name: "우유", quantity: "1개", amount: 1, unit: "개", expiry: addDays(today, -2) });
  await h.put(`${u}/routines/r1`, { title: "환기하기", time: "07:30", doneToday: true });
  await h.put(`${u}/routines/r2`, { title: "설거지하기", time: "19:00", doneToday: false });
  const monthTotal = tx.filter((t) => t.date.startsWith(today.slice(0, 7))).reduce((a, t) => a + t.amount, 0);
  return { lastWeekSpent: 12000, monthTotal };
}

async function seedCommon(h: Harness) {
  for (const f of sampleFaqs) await h.put(`emergency_faq/${f.faq_id}`, f as any);
  // 검증 안 된(draft) FAQ는 AI가 쓰면 안 됨
  await h.put("emergency_faq/pest-draft", { ...sampleFaqs[1], faq_id: "pest-draft", title: "벌레가 나왔을 때", keywords: ["벌레", "바퀴"], category: "해충", status: "draft" });
}

// ---------------------------------------------------------------------------
// 시나리오
// ---------------------------------------------------------------------------
let pass = 0;
let fail = 0;
function check(label: string, cond: boolean, detail?: unknown) {
  if (cond) pass++;
  else fail++;
  console.log(`${cond ? "✅" : "❌"} ${label}${!cond && detail !== undefined ? `\n     → ${JSON.stringify(detail).slice(0, 300)}` : ""}`);
}
const okData = (r: Result) => (r.ok ? r.data : undefined);

async function scenario(h: Harness, mock: string) {
  const aiOk = mock !== "fail";
  console.log(`\n========== LLM_MOCK=${mock} (${aiOk ? "AI 정상 응답" : "AI 실패"}) · 오늘 ${today} ==========`);
  await seedCommon(h);
  const uid = (await h.newUser())!;
  const { lastWeekSpent, monthTotal } = await seedUser(h, uid);

  console.log("\n[로그인 확인]");
  for (const fn of ["generateDailyReport", "listReports", "generateWeeklyReport", "askAiManager", "recommendRecipes"]) {
    const r = await h.call(fn, { message: "안녕" }, null);
    check(`${fn}: 로그인 안 하면 거절`, !r.ok && r.code === "unauthenticated", r);
  }

  console.log("\n[오늘 리포트 generateDailyReport]");
  let r = await h.call("generateDailyReport", {}, uid);
  let d = okData(r);
  check("호출 성공", r.ok, r);
  if (aiOk) {
    check("AI 리포트 생성 (stale=false, cached=false)", d?.stale === false && d?.cached === false && String(d?.today_message).includes("[MOCK]"), d);
    check("Firestore에 저장됨", !!(await h.read(`users/${uid}/ai_reports/${today}`)));
  } else {
    check("AI 실패 → 템플릿 리포트 (stale=true)", d?.stale === true && !String(d?.today_message).includes("[MOCK]") && !!d?.today_message, d);
    check("실패한 리포트는 저장 안 함", !(await h.read(`users/${uid}/ai_reports/${today}`)));
    const won = `${monthTotal.toLocaleString("ko-KR")}원`;
    check(`템플릿에 실제 수치 반영 (이번 달 지출 ${won})`, String(d?.expense_summary).includes(won), d?.expense_summary);
  }
  r = await h.call("generateDailyReport", {}, uid);
  d = okData(r);
  check(aiOk ? "두 번째 호출은 저장본 재사용 (cached=true)" : "두 번째 호출도 템플릿 (다음에 다시 시도)", aiOk ? d?.cached === true : d?.stale === true, d);
  if (aiOk) {
    r = await h.call("generateDailyReport", { force: true }, uid);
    check("force=true면 새로 생성", okData(r)?.cached === false, okData(r));
  }

  console.log("\n[지난 리포트 listReports]");
  r = await h.call("listReports", { limit: 5 }, uid);
  d = okData(r);
  check(aiOk ? "저장된 리포트 1건" : "저장된 리포트 0건", r.ok && d?.reports?.length === (aiOk ? 1 : 0) && d?.has_more === false, d);

  console.log("\n[주간 리포트 generateWeeklyReport]");
  r = await h.call("generateWeeklyReport", {}, uid);
  d = okData(r);
  check("호출 성공", r.ok, r);
  check(`지난주 지출 합계 = ${lastWeekSpent}원 (코드 계산)`, d?.stats?.spent_total === lastWeekSpent, d?.stats);
  check("전주 대비 변화율 -40% (20,000 → 12,000)", d?.stats?.change_percent === -40, d?.stats);
  check("앱에서 기록 안 하는 항목은 null (요리·폐기·루틴)", d?.stats?.cooked_count === null && d?.stats?.wasted_count === null && d?.stats?.routine_percent === null, d?.stats);
  check(aiOk ? "AI 문장 (ai=true)" : "AI 실패 → 템플릿 문장 (ai=false)", aiOk ? d?.ai === true && String(d?.text?.weekly_summary).includes("[MOCK]") : d?.ai === false && String(d?.text?.weekly_summary).includes("12,000원"), d?.text);
  r = await h.call("generateWeeklyReport", {}, uid);
  check(aiOk ? "두 번째 호출은 저장본 재사용" : "실패한 주간 리포트는 저장 안 함", aiOk ? okData(r)?.cached === true : okData(r)?.cached === false, okData(r));

  console.log("\n[AI 채팅 askAiManager]");
  r = await h.call("askAiManager", { message: "이번 달 얼마 썼어?", history: [{ role: "user", content: "안녕" }, { role: "assistant", content: "안녕하세요" }] }, uid);
  d = okData(r);
  check(aiOk ? "답변 받음" : "AI 실패 → 안내 문구 (failed=true)", aiOk ? String(d?.reply).includes("[MOCK]") : d?.failed === true, d);
  r = await h.call("askAiManager", { message: "천장에서 물이 새요" }, uid);
  check("생활 문제 질문 → 바로가기 버튼 (누수·단수 대처, 앱 형식)", okData(r)?.action?.screen === "EmergencyDetail" && okData(r)?.action?.params?.id === "leak", okData(r));
  r = await h.call("askAiManager", { message: "가스 냄새가 나요" }, uid);
  check("위급 키워드 → AI 없이 119 안내 (safety=true)", okData(r)?.safety === true && String(okData(r)?.reply).includes("119"), okData(r));
  r = await h.call("askAiManager", { message: "   " }, uid);
  check("빈 질문 거절 (invalid-argument)", !r.ok && r.code === "invalid-argument", r);
  r = await h.call("askAiManager", { message: "가".repeat(501) }, uid);
  check("501자 질문 거절 (invalid-argument)", !r.ok && r.code === "invalid-argument", r);
  await h.put(`users/${uid}/ai_usage/chat_${today}`, { count: 30 });
  r = await h.call("askAiManager", { message: "남은 예산은?" }, uid);
  check("하루 질문 횟수 초과 → limited", okData(r)?.limited === true, okData(r));

  console.log("\n[비상매뉴얼 askEmergencyManual]");
  r = await h.call("askEmergencyManual", { message: "가스 밸브 잠그는 법 알려줘" }, uid);
  d = okData(r);
  if (aiOk) check("FAQ 근거로 AI 답변 + 119 안내 + 출처", d?.ai === true && d?.faq_ids?.[0] === "gas-smell" && String(d?.reply).includes("119") && String(d?.reply).includes("출처"), d);
  else check("AI 실패 → FAQ 원문 그대로 (reason=failed)", d?.ai === false && d?.reason === "failed" && String(d?.reply).includes("가스 냄새가 날 때"), d);
  r = await h.call("askEmergencyManual", { message: "정전이 됐어요" }, null);
  check("로그인 안 해도 FAQ 원문은 보여줌 (login_required)", okData(r)?.reason === "login_required" && String(okData(r)?.reply).includes("정전"), okData(r));
  r = await h.call("askEmergencyManual", { message: "지진 나면 어떻게 해?" }, uid);
  check("맞는 FAQ 없으면 지어내지 않음 (no_faq)", okData(r)?.reason === "no_faq", okData(r));
  r = await h.call("askEmergencyManual", { message: "벌레가 나왔어요" }, uid);
  check("검증 안 된(draft) FAQ는 사용 안 함", okData(r)?.reason === "no_faq", okData(r));

  console.log("\n[AI 레시피 recommendRecipes]");
  r = await h.call("recommendRecipes", { max_minutes: 20 }, uid);
  d = okData(r);
  check("소비기한 지난 우유는 제외", JSON.stringify(d?.excluded_expired) === '["우유"]', d?.excluded_expired);
  if (aiOk) {
    const ing = d?.recipes?.[0]?.ingredients?.find((i: any) => i.from_inventory);
    check("레시피 생성 + 임박 재료(두부) 사용", d?.reason === null && d?.recipes?.[0]?.uses_expiring?.includes("두부"), d);
    check("차감용 inventory_id = 앱 문서 id (f-tofu)", ing?.inventory_id === "f-tofu", ing);
    const rc = d?.recipes?.[0];
    check("앱용 필드 (id, 난이도, 아이콘, missing)", !!rc?.id && ["아주 쉬움", "쉬움", "보통"].includes(rc?.difficulty) && !!rc?.icon && rc?.ingredients?.every((i: any) => typeof i.missing === "boolean"), rc);
  } else {
    check("AI 실패 → 빈 목록 + 임박 재료 안내 (reason=failed)", d?.reason === "failed" && d?.recipes?.length === 0 && d?.expiring?.includes("두부"), d);
  }
  r = await h.call("recommendRecipes", { must_use: ["연어"] }, uid);
  check("없는 재료 지정 → must_use_not_found", okData(r)?.reason === "must_use_not_found", okData(r));

  console.log("\n[진단도 기록도 없는 새 사용자]");
  const fresh = (await h.newUser())!;
  r = await h.call("generateDailyReport", {}, fresh);
  check("오늘 리포트: 에러 없이 동작", r.ok && !!okData(r)?.today_message, r);
  if (!aiOk) check("AI 실패 시 환영 템플릿", String(okData(r)?.today_message).includes("환영"), okData(r));
  r = await h.call("generateWeeklyReport", {}, fresh);
  check("주간 리포트: 기록 없음 → AI 호출 없이 안내", r.ok && okData(r)?.ai === false && String(okData(r)?.text?.weekly_summary).includes("기록이 없었어요"), okData(r));
  r = await h.call("recommendRecipes", {}, fresh);
  check("레시피: 재료 없음 → no_inventory", okData(r)?.reason === "no_inventory", okData(r));
}

async function main() {
  if (EMULATOR) {
    const mock = process.env.E2E_LLM_MOCK ?? "1"; // Functions Emulator의 LLM_MOCK과 같은 값 (run-e2e.mjs가 맞춰 줌)
    await scenario(await emulatorHarness(), mock);
  } else {
    for (const mock of ["1", "fail"]) {
      process.env.LLM_MOCK = mock;
      await scenario(await localHarness(), mock);
    }
  }
  console.log(`\n결과: ✅ ${pass}개 통과 · ❌ ${fail}개 실패`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
