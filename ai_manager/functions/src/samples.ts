// 오프라인 확인(API 키 불필요): npm run sample
import { analyze } from "./analyze";
import { normalizeHistory, safetyKind, safetyReply } from "./common";
import { composeReply, parseEmergency, rankFaqs, renderFaq } from "./emergencyRules";
import { personas, sampleFaqs } from "./fixtures";
import { buildContext } from "./prompt";
import { amountsAreGrounded, collectNumbers, parseReport, ratiosAreGrounded } from "./validate";
import { profile, recipeInventory, weeklyInput } from "./fixtures";
import { normalizeProfile } from "./profile";
import { compact, toBudget, toExpense, toInventoryItem, toRoutine, todayLogsFromRoutines } from "./adapters";
import { uiDocs } from "./fixtures";
import { fallbackReport } from "./generate";
import { analyzeWeek, buildWeeklyContext, fallbackWeekly, lastWeekStart, parseWeekly } from "./weekly";
import { buildRecipeContext, normalizeRecipeOptions, parseRecipes } from "./recipeRules";
import { contactsAreSafe, pickChatAction } from "./chatRules";

for (const [name, input] of Object.entries(personas)) {
  const a = analyze(input);
  console.log(`\n=== ${name} === goal=${a.goal} cold_start=${a.cold_start}`);
  console.log("insights:", a.insights.map((i) => `${i.code}(${i.priority})`).join(", "));
}

const allowedOf = (name: string) => collectNumbers(buildContext(profile, analyze(personas[name])));
const report = (o: object) => JSON.stringify({ expense_summary: "-", inventory_summary: "-", routine_summary: "-", actions: ["확인하기"], ...o });

console.log("\n--- 리포트 검증: 자연스러운 문장이 통과/차단되는지 ---");
const cases: [string, string, string][] = [
  ["임박재료형", "개수 표현(3개)", report({ today_message: "소비기한이 가까운 재료가 3개 있어요. 우유부터 써 볼까요?" })],
  ["예산초과형", "남은 예산", report({ today_message: "이번 달 남은 예산은 140,000원이에요. 하루 5,384원씩 쓰면 돼요." })],
  ["예산초과형", "환산(14만원) → 차단돼야 함", report({ today_message: "이번 달 남은 예산은 14만원이에요." })],
  ["예산초과형", "없는 숫자(135,000원) → 차단돼야 함", report({ today_message: "이번 달 135,000원을 썼어요." })],
];
for (const [persona, label, text] of cases) {
  console.log(`${parseReport(text, allowedOf(persona)) ? "통과" : "차단"}  [${persona}] ${label}`);
}

console.log("\n--- 채팅 규칙 ---");
console.log("응급:", safetyReply("가스 냄새가 나는데 어떡해요?")?.slice(0, 20));
console.log("자해:", safetyReply("요즘 죽고 싶어요")?.slice(0, 20));
console.log("일반:", safetyReply("이번 달 식비 얼마 썼어?"));
console.log("history 정리:", JSON.stringify(normalizeHistory([
  { role: "assistant", content: "안녕하세요" },
  { role: "user", content: "질문1" },
  { role: "user", content: "질문1-2" },
  { role: "assistant", content: "답1" },
  { role: "user", content: "미완성 질문" },
  { role: "system", content: "무시되어야 함" },
])));
const chatAllowed = allowedOf("예산초과형");
console.log("금액 검증(110,000원 + 일반팁 3일):", amountsAreGrounded("이번 달 110,000원 썼어요. 두부는 냉장 3일 정도 보관해요.", chatAllowed));
console.log("금액 검증(없는 13만원):", amountsAreGrounded("이번 달 13만원 썼어요.", chatAllowed));
console.log("금액 검증(식비 합계 100,000원):", amountsAreGrounded("식비로 100,000원을 썼어요.", chatAllowed));

console.log("\n--- 비상매뉴얼 ---");
const top = (q: string) => rankFaqs(sampleFaqs, q).map((f) => f.faq_id).join(",") || "(없음)";
console.log("검색 '가스 밸브 잠그는 법':", top("가스 밸브 잠그는 법"));
console.log("검색 '정전됐는데 어떡해':", top("정전됐는데 어떡해"));
console.log("검색 '지진 나면 어떡해':", top("지진 나면 어떡해"));
console.log("가드 kind '가스 냄새가 나요':", safetyKind("가스 냄새가 나요"), "/ '가스 밸브 잠그는 법':", safetyKind("가스 밸브 잠그는 법"));
const gasFaqs = rankFaqs(sampleFaqs, "가스 밸브 잠그는 법");
const mk = (o: object) => JSON.stringify(o);
const okEm = parseEmergency(mk({ answer: "가스 밸브를 먼저 잠그고 창문을 열어 환기하세요. 이후 밖으로 대피해 119에 연락하세요.", faq_ids: ["gas-smell"] }), gasFaqs, "가스 밸브 잠그는 법");
console.log("검증(정상):", okEm ? "통과" : "실패");
console.log("검증(없는 FAQ id):", parseEmergency(mk({ answer: "확인하세요.", faq_ids: ["fire"] }), gasFaqs, "q") ? "통과(문제)" : "차단");
console.log("검증(지어낸 번호 112):", parseEmergency(mk({ answer: "112에 전화하세요.", faq_ids: ["gas-smell"] }), gasFaqs, "q") ? "통과(문제)" : "차단");
console.log("검증(faq_ids 비어 있음=범위 밖):", JSON.stringify(parseEmergency(mk({ answer: "확인된 안내가 없어요.", faq_ids: [] }), gasFaqs, "q")));
console.log("\n[조립된 답변 예시]\n" + composeReply(okEm!.answer, okEm!.faq_ids, gasFaqs));
console.log("\n[AI 없이 FAQ 원문]\n" + renderFaq(sampleFaqs[1]));

console.log("\n--- AI 레시피 ---");
{
  const opts = normalizeRecipeOptions({ max_minutes: 20 });
  const { ctx, excluded_expired } = buildRecipeContext(profile, recipeInventory, "2026-11-05", opts);
  console.log("요청 정리(잘못된 값→기본값):", JSON.stringify(normalizeRecipeOptions({ max_minutes: 999, count: "3", must_use: ["두부", 7] })));
  console.log("AI에 보내는 재료:", ctx.inventory.map((i) => `${i.name}${i.expiring ? "(임박)" : ""}`).join(", "), "/ 제외(소비기한 지남):", excluded_expired.join(","));
  const mk = (r: object) => JSON.stringify({ recipes: [{ title: "두부 달걀찜", minutes: 10, tools: ["microwave"], ingredients: [{ name: "두부", quantity: 1 }, { name: "달걀", quantity: 2 }, { name: "간장", quantity: null }], steps: ["두부와 달걀을 섞어요.", "전자레인지에 익혀요."], ...r }] });
  const cases: [string, string][] = [
    ["정상", mk({})],
    ["냉장고에 없는 재료 1개(애호박) → 통과 ('필요한 재료')", mk({ ingredients: [{ name: "두부", quantity: 1 }, { name: "애호박", quantity: null, amount: "1/3개" }] })],
    ["냉장고에 없는 재료 3개 → 차단돼야 함", mk({ ingredients: [{ name: "두부", quantity: 1 }, { name: "애호박", quantity: null }, { name: "양파", quantity: null }, { name: "돼지고기", quantity: null }] })],
    ["보유량 초과(달걀 6개) → 차단돼야 함", mk({ ingredients: [{ name: "달걀", quantity: 6 }] })],
    ["소비기한 지난 우유 → 차단돼야 함", mk({ ingredients: [{ name: "두부", quantity: 1 }, { name: "우유", quantity: 100 }] })],
    ["없는 도구(oven) → 차단돼야 함", mk({ tools: ["oven"] })],
    ["시간 초과(40분 > 20분) → 차단돼야 함", mk({ minutes: 40 })],
    ["양념만 사용 → 차단돼야 함", mk({ ingredients: [{ name: "간장", quantity: null }] })],
    ["수량 모르는 김치(null) → 통과", mk({ ingredients: [{ name: "김치", quantity: null }, { name: "참기름", quantity: null }] })],
  ];
  for (const [label, text] of cases) console.log(`${parseRecipes(text, ctx, recipeInventory) ? "통과" : "차단"}  ${label}`);
  const must = buildRecipeContext(profile, recipeInventory, "2026-11-05", normalizeRecipeOptions({ must_use: ["대파"] })).ctx;
  console.log(`${parseRecipes(mk({}), must, recipeInventory) ? "통과" : "차단"}  must_use=대파인데 대파 미사용 → 차단돼야 함`);
  const ok = parseRecipes(mk({}), ctx, recipeInventory)!;
  console.log("\n[검증 후 코드가 붙인 필드]\n" + JSON.stringify(ok[0], null, 2));
}

console.log("\n--- 주간 리포트 ---");
{
  console.log("지난주 시작일(목 11-05 / 월 11-02 / 일 11-08):", lastWeekStart("2026-11-05"), lastWeekStart("2026-11-02"), lastWeekStart("2026-11-08"));
  const wa = analyzeWeek(weeklyInput);
  console.log("stats:", JSON.stringify(wa.stats));
  console.log("good:", wa.good.join(","), "/ improve:", wa.improve.join(","));
  const allowed = collectNumbers(buildWeeklyContext(wa));
  const mk = (o: object) => JSON.stringify({ weekly_summary: "지난주 지출은 62,000원으로 전주보다 22% 줄었어요.", good_point: "요리를 2번 했어요.", improve_point: "폐기 기록이 1건 있었어요.", next_week_goal: "장보기 전에 냉장고 확인하기", ...o });
  const cases: [string, string][] = [
    ["정상(62,000원, 22%, 2번)", mk({})],
    ["환산(6만원) → 차단돼야 함", mk({ weekly_summary: "지난주 지출은 6만원이었어요." })],
    ["없는 숫자(70,000원) → 차단돼야 함", mk({ weekly_summary: "지난주 지출은 70,000원이었어요." })],
    ["필드 누락 → 차단돼야 함", JSON.stringify({ weekly_summary: "요약" })],
  ];
  for (const [label, text] of cases) console.log(`${parseWeekly(text, allowed) ? "통과" : "차단"}  ${label}`);
  console.log("템플릿:", JSON.stringify(fallbackWeekly(wa)));
  console.log("템플릿(기록 없음):", JSON.stringify(fallbackWeekly(analyzeWeek({ ...weeklyInput, expenses: [], usage_logs: [], routines: [], routine_logs: [] }))).slice(0, 60) + "…");
}

console.log("\n--- 30초 자취 진단 → PROFILE 정리 ---");
{
  // 화면 선택지(한글)로 저장된 경우
  console.log("한글 선택지:", JSON.stringify(normalizeProfile({ living_period: "6개월 미만", priority: "낭비 줄이기", cooking_tools: ["전자레인지", "가스·인덕션"], cooking_days_per_week: 3, monthly_budget_krw: "500,000", initial_inventory_state: "재료가 있어요" })));
  // 일부만 입력 / 진단 안 함 / 이상한 값
  console.log("일부만 입력:", JSON.stringify(normalizeProfile({ priority: "save_money", cooking_tools: [] })));
  console.log("진단 안 함:", JSON.stringify(normalizeProfile(undefined)));
  console.log("이상한 값:", JSON.stringify(normalizeProfile({ cooking_days_per_week: 9, monthly_budget_krw: -1, cooking_tools: ["오븐", "밥솥", "밥솥"] })));
  // 진단 안 한 사용자도 리포트·레시피 조건이 정상으로 만들어지는지
  const blank = normalizeProfile(undefined);
  const a = analyze({ ...personas["예산초과형"], profile: blank });
  console.log("진단 안 함 → 리포트 분석:", a.goal, a.insights.map((i) => i.code).join(","), "/ 컨텍스트 profile:", JSON.stringify(buildContext(blank, a).profile));
  const { ctx } = buildRecipeContext(blank, recipeInventory, "2026-11-05", normalizeRecipeOptions({}));
  console.log("진단 안 함 → 레시피 도구:", JSON.stringify(ctx.tools), "(빈 배열 = 도구 없는 요리만)");
}

console.log("\n--- 앱(UI) 데이터 → 서버 형식 변환 ---");
{
  const today = "2026-11-05";
  const expenses = compact(uiDocs.transactions.map((d) => toExpense(d.data)));
  console.log("소비:", expenses.map((e) => `${e.store} ${e.total_amount}(식비 ${e.food_amount})`).join(" / "), `← ${uiDocs.transactions.length}건 중 ${expenses.length}건 (금액 없는 건 제외)`);
  const inventory = compact(uiDocs.fridgeItems.map((d) => toInventoryItem(d.id, d.data)));
  console.log("식재료:", inventory.map((i) => `${i.item_name} ${i.quantity}${i.unit} ~${i.expiry_date} [${i.inventory_id}]`).join(" / "));
  const routines = compact(uiDocs.routines.map((d) => toRoutine(d.id, d.data)));
  const logs = todayLogsFromRoutines(uiDocs.routines, today);
  const input = { today, profile: normalizeProfile(undefined), budget: toBudget(uiDocs.budget, "2026-11"), expenses, inventory, usage_logs: [], routines, routine_logs: logs, routine_tracking: "today_only" as const, usage_tracking: false };
  const a = analyze(input);
  console.log("소비 요약:", JSON.stringify({ month_total: a.summary.expense.month_total, food_spent: a.summary.expense.food_spent, by_category: a.summary.expense.by_category, remaining: a.summary.expense.remaining_budget }));
  console.log("재고 요약:", JSON.stringify({ expiring: a.summary.inventory.expiring_items, waste: a.summary.inventory.waste_count_30d, cook: a.summary.inventory.cook_count_30d }), "(기록 안 하면 null)");
  console.log("루틴 요약:", JSON.stringify(a.summary.routine));
  console.log("인사이트:", a.insights.map((i) => i.code).join(", "), "(오늘 하루치로는 ROUTINE_LOW 안 냄)");
  console.log("템플릿 리포트:", JSON.stringify(fallbackReport(a)));
  const wk = analyzeWeek({ week_start: "2026-10-26", profile: input.profile, expenses, usage_logs: [], routines, routine_logs: logs, routine_tracking: "today_only", usage_tracking: false });
  console.log("주간(기록 없는 항목):", JSON.stringify({ cooked: wk.stats.cooked_count, wasted: wk.stats.wasted_count, routine: wk.stats.routine_percent }), "→", JSON.stringify(fallbackWeekly(wk)).slice(0, 80) + "…");
}

console.log("\n--- 레시피 응답 형식 (앱용 필드) ---");
{
  const { ctx } = buildRecipeContext(profile, recipeInventory, "2026-11-05", normalizeRecipeOptions({ max_minutes: 20 }));
  const r = parseRecipes(JSON.stringify({ recipes: [{ title: "두부 애호박 된장찌개", minutes: 15, difficulty: "보통", tools: ["microwave"], ingredients: [{ name: "두부", quantity: 1 }, { name: "된장", quantity: null, amount: "1큰술" }, { name: "애호박", quantity: null, amount: "1/3개" }], steps: ["재료를 썰어요.", "끓여요."] }, { title: "바나나 스무디", minutes: 5, tools: [], ingredients: [{ name: "달걀", quantity: 1 }], steps: ["섞어요.", "마셔요."] }] }), { ...ctx, count: 2 }, recipeInventory)!;
  console.log(r.map((x) => `${x.id} ${x.title} [${x.difficulty}, ${x.icon}] ` + x.ingredients.map((i) => `${i.name}:${i.from_inventory ? "냉장고" : i.missing ? "필요" : "양념"}(${i.amount_text})`).join(" ")).join("\n"));
  console.log("소비기한 지난 재료를 AI에도 알려줌:", JSON.stringify(ctx.expired_do_not_use), "/ 없는 재료 허용:", ctx.max_missing);
}

console.log("\n--- 채팅: 바로가기 버튼 · 지어낸 연락처 ---");
for (const q of ["천장에서 물이 새요", "유통기한 지난 음식은요?", "이번 달 소비 점검해줘", "청소 주기 알려줘", "냉장고 재료로 뭐 해먹지?", "오늘 날씨 어때?"]) {
  const a = pickChatAction(q);
  console.log(`  "${q}" → ${a ? a.label : "(버튼 없음)"}`);
}
for (const [label, text] of [
  ["119 안내", "위험하면 119에 먼저 전화하세요."],
  ["지어낸 하이픈 번호(1544-4500) → 차단돼야 함", "가스안전공사 1544-4500으로 연락하세요."],
  ["지어낸 3자리 번호(120) → 차단돼야 함", "120번에 전화해 보세요."],
  ["날짜·분량은 통과", "2026-11-05까지 두부 300g을 드세요."],
] as const) console.log(`${contactsAreSafe(text) ? "통과" : "차단"}  ${label}`);

console.log("\n--- Groq 실제 출력으로 만든 회귀 테스트 (2026-11-10 eval) ---");
{
  // 1) 리포트: "7일" 때문에 실패했던 실제 답변 → 기준 기간을 데이터에 넣었으므로 통과해야 함
  const budgetOver = '{"today_message":"이번 달 예산 사용 속도가 빠릅니다.","expense_summary":"이번 달 총 지출은 110000원이며, 예산은 250000원, 남은 예산은 140000원입니다. 지출 비율은 44%이고 경과 비율은 17%이며 일일 허용액은 5384원입니다.","inventory_summary":"현재 재고 아이템은 1개이며, 유통기한이 임박한 아이템은 없습니다.","routine_summary":"오늘 등록된 루틴이 없으며, 7일 내에 예정된 루틴도 없습니다.","actions":["예산 남은 금액 확인","식비 지출 기록","냉장고 재료 추가"]}';
  const parsed = parseReport(budgetOver, allowedOf("예산초과형"));
  console.log(`${parsed ? "통과" : "차단"}  [리포트] '최근 7일' 언급 → 통과해야 함`);
  console.log(`      금액 쉼표 정리: ${parsed?.expense_summary}`);
  // 2) 비상매뉴얼: 목록 번호 때문에 실패했던 실제 답변 → 통과해야 함
  const powerFaqs = rankFaqs(sampleFaqs, "정전이 됐는데 뭐부터 해야 해?");
  const powerAns = '{"answer":"1. 차단기가 내려갔는지 확인하세요. 2. 전자제품 전원을 끄거나 플러그를 뽑으세요. 3. 건물 전체가 정전이면 관리사무소에 문의하세요.", "faq_ids":["power-outage"]}';
  console.log(`${parseEmergency(powerAns, powerFaqs, "정전이 됐는데 뭐부터 해야 해?") ? "통과" : "차단"}  [비상매뉴얼] 1. 2. 3. 목록 번호 → 통과해야 함`);
  console.log(`${parseEmergency('{"answer":"1. 112에 전화하세요.","faq_ids":["power-outage"]}', powerFaqs, "q") ? "통과(문제)" : "차단"}  [비상매뉴얼] 목록 번호 뒤 지어낸 112 → 차단돼야 함`);
  // 3) 채팅: AI가 직접 계산한 배수 → 막혀야 함 / 데이터의 % → 통과
  const chatAllowed2 = allowedOf("예산초과형");
  const ratioAns = "이번 기간에 110,000원을 사용했어요. 지난 같은 기간에 40,000원 이용했으니 약 2.75배 증가했네요.";
  console.log(`${amountsAreGrounded(ratioAns, chatAllowed2) && ratiosAreGrounded(ratioAns, chatAllowed2) ? "통과(문제)" : "차단"}  [채팅] 직접 계산한 2.75배 → 차단돼야 함`);
  console.log(`${ratiosAreGrounded("예산의 44%를 썼어요.", chatAllowed2) ? "통과" : "차단"}  [채팅] 데이터에 있는 44% → 통과해야 함`);
}

console.log("\n--- Groq 실제 출력 회귀 테스트 2 (레시피 조리 순서 속 도구) ---");
{
  const ctxOf = (tools: string[]) => buildRecipeContext({ ...profile, cooking_tools: tools }, recipeInventory, "2026-11-05", normalizeRecipeOptions({ max_minutes: 30 })).ctx;
  const one = (r: object) => JSON.stringify({ recipes: [r] });
  const cases: [string, string[], object][] = [
    ["도구 없음인데 프라이팬·중불 (실제 출력) → 차단돼야 함", [], { title: "두부 김치 스크램블", minutes: 20, tools: [], ingredients: [{ name: "두부", quantity: 1 }, { name: "김치", quantity: null }, { name: "달걀", quantity: 2 }], steps: ["두부를 손으로 부숴서 볼에 담는다.", "달걀을 풀어 두부와 김치를 넣고 고루 섞는다.", "프라이팬에 참기름을 두르고 중불에 재료를 부어 스크램블한다.", "소금으로 간을 맞추고 5분 정도 익힌 뒤 그릇에 담는다."] }],
    ["도구 없음인데 냄비에 끓이기 (실제 출력) → 차단돼야 함", [], { title: "대파 두부 된장국", minutes: 25, tools: [], ingredients: [{ name: "두부", quantity: 1 }, { name: "대파", quantity: 1 }, { name: "된장", quantity: null }], steps: ["냄비에 물 2컵을 붓고 끓인다.", "된장을 물에 풀어 국물을 만든다.", "두부를 넣고 3분간 끓인다."] }],
    ["도구 없음 + 썰고 무치기 (지난 실행 출력) → 통과해야 함", [], { title: "두부 대파 무침", minutes: 10, tools: [], ingredients: [{ name: "두부", quantity: 1 }, { name: "대파", quantity: 1 }, { name: "참기름", quantity: null }], steps: ["두부를 2cm 크기로 깍둑썰기한다.", "대파는 얇게 송송 썬다.", "볼에 두부와 대파를 넣고 소금, 참기름, 깨를 뿌린다.", "가볍게 섞어 접시에 담아낸다."] }],
    ["전자레인지 레시피 (실제 출력) → 통과해야 함", ["microwave"], { title: "두부 김치 전자레인지 찜", minutes: 15, tools: ["microwave"], ingredients: [{ name: "두부", quantity: 1 }, { name: "김치", quantity: null }], steps: ["두부를 1cm 두께로 썰어 그릇에 담는다.", "김치를 작게 썰어 두부 위에 올린다.", "전자레인지 800W에 5분간 가열한다.", "가열 후 살짝 섞어 1분 더 돌린다"] }],
    ["전자레인지만 있는데 프라이팬 사용 → 차단돼야 함", ["microwave"], { title: "달걀볶음", minutes: 10, tools: ["microwave"], ingredients: [{ name: "달걀", quantity: 2 }], steps: ["달걀을 푼다.", "프라이팬에 볶는다."] }],
  ];
  for (const [label, tools, r] of cases) console.log(`${parseRecipes(one(r), ctxOf(tools), recipeInventory) ? "통과" : "차단"}  ${label}`);
}
