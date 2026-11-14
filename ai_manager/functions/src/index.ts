import { FieldValue } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { analyze } from "./analyze";
import { answerChat } from "./chat";
import { DAILY_CHAT_LIMIT, pickChatAction } from "./chatRules";
import { CALL_119_LINE, MAX_MESSAGE_LEN, normalizeHistory, safetyKind, safetyReply } from "./common";
import { consumeQuota, db, loadInput, loadRecipeInput, loadVerifiedFaqs, loadWeeklyInput, PATHS, todayKST } from "./data";
import { analyzeWeek, fallbackWeekly, generateWeeklyText, lastWeekStart } from "./weekly";
import { generateRecipes } from "./recipe";
import { buildRecipeContext, DAILY_RECIPE_LIMIT, normalizeRecipeOptions } from "./recipeRules";
import { answerEmergency } from "./emergency";
import { composeReply, DAILY_EMERGENCY_LIMIT, NO_FAQ_REPLY, rankFaqs, renderFaq } from "./emergencyRules";
import { fallbackReport, generateReport } from "./generate";
import { AiReport } from "./types";

const LLM_API_KEY = defineSecret("ANTHROPIC_API_KEY"); // firebase functions:secrets:set ANTHROPIC_API_KEY
const DAILY_REPORT_FORCE_LIMIT = 5; // 리포트 재생성(force) 하루 한도
const OPTIONS = { region: "asia-northeast3", secrets: [LLM_API_KEY], timeoutSeconds: 60 };

const pick = (d: FirebaseFirestore.DocumentData): AiReport & { report_date: string } => ({
  report_date: d.report_date,
  today_message: d.today_message,
  expense_summary: d.expense_summary,
  inventory_summary: d.inventory_summary,
  routine_summary: d.routine_summary,
  actions: d.actions,
});

// 클라이언트: httpsCallable("generateDailyReport")({ force?: boolean })  ← 설계 문서의 POST /ai/report
export const generateDailyReport = onCall(OPTIONS, async (request) => {
  const uid = request.auth?.uid; // user_id는 인증 정보에서 결정, body 값은 신뢰하지 않음
  if (!uid) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");

  const today = todayKST();
  const ref = db.doc(`${PATHS.aiReports(uid)}/${today}`);

  // 하루 1회 생성 후 저장본 재사용 (force=true면 재생성)
  if (!request.data?.force) {
    const cached = await ref.get();
    if (cached.exists) return { ...pick(cached.data()!), cached: true, stale: false };
  }

  if (request.data?.force && !(await consumeQuota(uid, "report_force", DAILY_REPORT_FORCE_LIMIT, today))) {
    throw new HttpsError("resource-exhausted", "오늘 리포트 재생성 횟수를 모두 사용했어요.");
  }

  const input = await loadInput(uid, today);
  const analysis = analyze(input);
  const report = await generateReport(LLM_API_KEY.value(), input.profile, analysis);

  if (report) {
    await ref.set({ user_id: uid, report_date: today, ...report, created_at: FieldValue.serverTimestamp() });
    return { report_date: today, ...report, cached: false, stale: false };
  }

  // AI 실패 시: 저장하지 않고 이전 리포트를 보여줌 (다음 호출에서 재시도). 이전 리포트가 없으면 템플릿.
  const prev = await db.collection(PATHS.aiReports(uid)).orderBy("report_date", "desc").limit(1).get();
  if (!prev.empty) return { ...pick(prev.docs[0].data()), cached: true, stale: true };
  return { report_date: today, ...fallbackReport(analysis), cached: false, stale: true };
});

// 클라이언트: httpsCallable("askAiManager")({ message, history?: [{role, content}] })  ← 설계 문서의 POST /ai/chat
// 응답: { reply, action } — action은 앱의 바로가기 버튼 형식({ label, screen, params } | { label, tab } | null), 코드가 키워드로 정함
export const askAiManager = onCall(OPTIONS, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");

  const message = typeof request.data?.message === "string" ? request.data.message.trim() : "";
  if (!message) throw new HttpsError("invalid-argument", "질문을 입력해 주세요.");
  if (message.length > MAX_MESSAGE_LEN) throw new HttpsError("invalid-argument", `질문은 ${MAX_MESSAGE_LEN}자 이내로 입력해 주세요.`);

  // 위급 상황 키워드는 LLM을 거치지 않고 고정 안내 (횟수 차감 없음)
  const action = pickChatAction(message);
  const safety = safetyReply(message);
  if (safety) return { reply: safety, safety: true, action };

  const today = todayKST();
  if (!(await consumeQuota(uid, "chat", DAILY_CHAT_LIMIT, today))) {
    return { reply: `오늘 질문 횟수(${DAILY_CHAT_LIMIT}회)를 모두 사용했어요. 내일 다시 물어봐 주세요!`, limited: true, action };
  }

  const input = await loadInput(uid, today);
  const analysis = analyze(input);
  const reply = await answerChat(LLM_API_KEY.value(), input.profile, analysis, normalizeHistory(request.data?.history), message);

  if (!reply) return { reply: "지금은 답변을 만들기 어려워요. 잠시 후 다시 물어봐 주세요.", failed: true, action };
  return { reply, action };
});

// 클라이언트: httpsCallable("askEmergencyManual")({ message, history? })
// 설계: FAQ 먼저 → 추가 질문은 AI. 위급하면 AI보다 119 안내가 우선. 개인 소비·재고 데이터는 읽지도, 보내지도 않는다.
export const askEmergencyManual = onCall(OPTIONS, async (request) => {
  const message = typeof request.data?.message === "string" ? request.data.message.trim() : "";
  if (!message) throw new HttpsError("invalid-argument", "질문을 입력해 주세요.");
  if (message.length > MAX_MESSAGE_LEN) throw new HttpsError("invalid-argument", `질문은 ${MAX_MESSAGE_LEN}자 이내로 입력해 주세요.`);

  const faqs = rankFaqs(await loadVerifiedFaqs(), message);
  const kind = safetyKind(message);

  // 1) 위급 키워드: LLM 없이 즉시 안내 (비로그인도 가능, 횟수 차감 없음)
  if (kind === "self_harm") return { reply: safetyReply(message), safety: true, faq_ids: [], ai: false };
  if (kind === "emergency") {
    const top = faqs[0];
    const reply = top ? `${CALL_119_LINE}\n\n${renderFaq(top)}` : `${CALL_119_LINE} 안전한 곳으로 이동하는 게 가장 중요해요.`;
    return { reply, safety: true, faq_ids: top ? [top.faq_id] : [], ai: false };
  }

  // 2) 맞는 FAQ가 없으면 지어내지 않고 고정 문구
  if (faqs.length === 0) return { reply: NO_FAQ_REPLY, faq_ids: [], ai: false, reason: "no_faq" };

  // 3) AI 사용 조건: 로그인 + 하루 횟수 이내. 아니면 FAQ 원문만 보여줌 (비용 보호)
  const uid = request.auth?.uid;
  const faqOnly = (reason: string) => ({ reply: renderFaq(faqs[0]), faq_ids: [faqs[0].faq_id], ai: false, reason });
  if (!uid) return faqOnly("login_required");
  if (!(await consumeQuota(uid, "emergency", DAILY_EMERGENCY_LIMIT, todayKST()))) return faqOnly("limited");

  // 4) FAQ 안에서만 답하도록 AI 호출 → 검증 → 출처는 코드가 붙임
  const result = await answerEmergency(LLM_API_KEY.value(), faqs, normalizeHistory(request.data?.history), message);
  if (!result) return faqOnly("failed");
  if (result.faq_ids.length === 0) return { reply: NO_FAQ_REPLY, faq_ids: [], ai: true, reason: "no_faq" };
  return { reply: composeReply(result.answer, result.faq_ids, faqs), faq_ids: result.faq_ids, ai: true };
});

// 클라이언트: httpsCallable("recommendRecipes")({ max_minutes?, servings?, count?, must_use?: string[] })
// 설계: 재고·조리 조건 정리 → AI 생성 → 코드가 결과 확인 → 사용자 선택. 재고 차감·레시피 저장은 하지 않는다.
// 요리 후에는 3모듈 화면에서 ingredients[].inventory_id / quantity를 '추천 사용량'으로 보여주고, 사용자가 확인한 값만 차감한다.
export const recommendRecipes = onCall(OPTIONS, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");

  const opts = normalizeRecipeOptions(request.data);
  const today = todayKST();
  const { profile, inventory } = await loadRecipeInput(uid);
  const { ctx, excluded_expired, must_use_missing } = buildRecipeContext(profile, inventory, today, opts);
  const base = { excluded_expired, must_use_missing };

  // 쓸 수 있는 재료가 없으면 AI 호출 없이 안내 (횟수 차감 없음)
  if (ctx.inventory.length === 0) {
    return { ...base, recipes: [], reason: "no_inventory", message: "추천에 쓸 수 있는 재료가 없어요. 냉장고에 재료를 등록해 보세요." };
  }
  if (opts.must_use.length > 0 && ctx.must_use.length === 0) {
    return { ...base, recipes: [], reason: "must_use_not_found", message: "선택한 재료를 냉장고에서 찾지 못했어요." };
  }

  if (!(await consumeQuota(uid, "recipe", DAILY_RECIPE_LIMIT, today))) {
    return { ...base, recipes: [], reason: "limited", message: `오늘 레시피 추천 횟수(${DAILY_RECIPE_LIMIT}회)를 모두 사용했어요.` };
  }

  const recipes = await generateRecipes(LLM_API_KEY.value(), ctx, inventory);
  if (!recipes) {
    const expiring = ctx.inventory.filter((i) => i.expiring).map((i) => i.name);
    return { ...base, recipes: [], reason: "failed", expiring, message: "지금은 레시피를 만들기 어려워요. 잠시 후 다시 시도해 주세요." };
  }
  return { ...base, recipes, reason: null };
});

// ---------------------------------------------------------------------
// 지난 리포트 · 주간 리포트 (설계 문서 p.52 '주간 · 지난 리포트')
// ---------------------------------------------------------------------

// 클라이언트: httpsCallable("listReports")({ limit?: 1~30, before?: "YYYY-MM-DD" })
// 저장된 일별 리포트를 최신순으로. before를 주면 그 날짜 이전 것부터 (더 보기용). AI 호출 없음.
export const listReports = onCall({ region: OPTIONS.region }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");

  const raw = Number(request.data?.limit);
  const limit = Number.isFinite(raw) ? Math.min(30, Math.max(1, Math.round(raw))) : 7;
  const before = typeof request.data?.before === "string" && /^\d{4}-\d{2}-\d{2}$/.test(request.data.before) ? request.data.before : null;

  let q = db.collection(PATHS.aiReports(uid)).orderBy("report_date", "desc");
  if (before) q = q.where("report_date", "<", before);
  const snap = await q.limit(limit + 1).get(); // 1건 더 읽어서 다음 페이지 여부 판단
  const reports = snap.docs.slice(0, limit).map((d) => pick(d.data()));
  const has_more = snap.docs.length > limit;
  return { reports, has_more, next_before: has_more ? reports[reports.length - 1].report_date : null };
});

const DAILY_WEEKLY_FORCE_LIMIT = 3;

// 클라이언트: httpsCallable("generateWeeklyReport")({ force?: boolean })
// 지난주(월~일) 기준. 그 주에 한 번 만들고 저장본 재사용. 숫자(stats)는 코드 계산값, 문장(text)만 AI.
export const generateWeeklyReport = onCall(OPTIONS, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");

  const today = todayKST();
  const weekStart = lastWeekStart(today);
  const ref = db.doc(`${PATHS.weeklyReports(uid)}/${weekStart}`);

  if (!request.data?.force) {
    const cached = await ref.get();
    if (cached.exists) {
      const d = cached.data()!;
      return { week_start: d.week_start, stats: d.stats, text: d.text, ai: true, cached: true };
    }
  } else if (!(await consumeQuota(uid, "weekly_force", DAILY_WEEKLY_FORCE_LIMIT, today))) {
    throw new HttpsError("resource-exhausted", "오늘 주간 리포트 재생성 횟수를 모두 사용했어요.");
  }

  const analysis = analyzeWeek(await loadWeeklyInput(uid, weekStart, today));
  // 기록이 하나도 없으면 AI 호출 없이 안내 (저장하지 않음 → 기록이 생기면 다음에 생성)
  if (analysis.no_data) return { week_start: weekStart, stats: analysis.stats, text: fallbackWeekly(analysis), ai: false, cached: false };

  const text = await generateWeeklyText(LLM_API_KEY.value(), analysis);
  if (text) {
    await ref.set({ user_id: uid, week_start: weekStart, stats: analysis.stats, text, created_at: FieldValue.serverTimestamp() });
    return { week_start: weekStart, stats: analysis.stats, text, ai: true, cached: false };
  }
  // AI 실패: 템플릿 문장으로 보여주고 저장하지 않음 (다음 호출에서 재시도)
  return { week_start: weekStart, stats: analysis.stats, text: fallbackWeekly(analysis), ai: false, cached: false };
});
