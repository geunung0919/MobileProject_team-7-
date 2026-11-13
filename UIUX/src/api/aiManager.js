import { callAi, isAiServerEnabled } from './firebase';
import { toChatHistory, toUiRecipe } from './aiFormat';

// AI 자취 매니저 서버 함수를 부르는 곳. 화면은 이 파일의 함수만 쓰면 됩니다.
// 응답 형식: ai_manager/functions/src/index.ts 주석, ai_manager/functions/RECIPE_API.md
export { isAiServerEnabled };

// 오늘 리포트 (홈 '오늘의 한마디', AI 자취 매니저 'AI 한마디', 리포트 상세 'AI 한마디·AI 제안')
// → { report_date, today_message, expense_summary, inventory_summary, routine_summary, actions[], cached, stale }
//   stale=true 면 AI 대신 이전 리포트나 기본 문장이에요.
// 여러 화면이 같이 쓰므로 같은 날에는 한 번만 부르고 결과를 나눠 씁니다 (force 면 새로).
let todayCache = null; // { day, promise }
export function fetchTodayReport({ force = false } = {}) {
  const day = new Date().toDateString();
  if (!force && todayCache?.day === day) return todayCache.promise;
  const promise = callAi('generateDailyReport', { force });
  todayCache = { day, promise };
  promise.catch(() => {
    if (todayCache?.promise === promise) todayCache = null; // 실패하면 다음에 다시 시도
  });
  return promise;
}

// 지난 리포트 목록 (일별) → { reports[], has_more, next_before }  (더 보기: fetchReports({ before: next_before }))
export const fetchReports = ({ limit = 7, before } = {}) => callAi('listReports', { limit, before });

// 주간 리포트 (지난주 월~일) → { week_start, stats{...}, text{ weekly_summary, good_point, improve_point, next_week_goal }, ai }
export const fetchWeeklyReport = ({ force = false } = {}) => callAi('generateWeeklyReport', { force });

// AI 채팅. messages = 채팅 화면의 메시지 배열 (새 질문 전까지)
// → { text, action }  action 은 화면의 바로가기 버튼 형식 그대로 ({ label, screen, params } | { label, tab } | null)
export async function sendChat(question, messages) {
  const res = await callAi('askAiManager', { message: question, history: toChatHistory(messages) });
  return { text: res.reply, action: res.action ?? null, limited: !!res.limited, failed: !!res.failed };
}

// 비상매뉴얼 AI → { reply, faq_ids[], ai, reason, safety }  (화면 형식 변환은 aiFormat.toEmergencyMessage)
export const askEmergency = (question, messages = []) =>
  callAi('askEmergencyManual', { message: question, history: toChatHistory(messages) });

// AI 레시피 → { recipes(화면 형식)[], reason, message, excludedExpired[] }
export async function fetchRecipes(options = {}) {
  const res = await callAi('recommendRecipes', options);
  return {
    recipes: (res.recipes ?? []).map(toUiRecipe),
    reason: res.reason ?? null,
    message: res.message ?? null,
    excludedExpired: res.excluded_expired ?? [],
  };
}
