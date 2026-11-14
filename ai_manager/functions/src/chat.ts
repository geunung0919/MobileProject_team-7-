import { buildChatSystem, contactsAreSafe, MAX_CHAT_REPLY_LEN } from "./chatRules";
import { askLlm } from "./llm";
import { buildContext } from "./prompt";
import { AnalysisResult, ChatTurn, Profile } from "./types";
import { amountsAreGrounded, collectNumbers, formatWon, numbersIn, ratiosAreGrounded } from "./validate";

export { buildChatSystem } from "./chatRules";

const MAX_ATTEMPTS = 2;

// 성공하면 답변 문자열, 실패하면 null (호출 측에서 안내 문구)
export async function answerChat(
  apiKey: string,
  profile: Profile,
  analysis: AnalysisResult,
  history: ChatTurn[],
  message: string
): Promise<string | null> {
  const context = buildContext(profile, analysis);
  const system = buildChatSystem(context);

  // 허용 금액 = 요약 데이터 + 사용자가 직접 말한 숫자
  const allowed = collectNumbers(context);
  const userText = [...history.filter((h) => h.role === "user").map((h) => h.content), message].join("\n");
  numbersIn(userText).forEach((n) => allowed.add(n));

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const text = (await askLlm(apiKey, system, [...history, { role: "user", content: message }], 500)).trim();
      if (!text || text.length > MAX_CHAT_REPLY_LEN) {
        console.warn(`chat reply length invalid (attempt ${attempt}, ${text.length}자)`);
        continue;
      }
      if (!amountsAreGrounded(text, allowed) || !ratiosAreGrounded(text, allowed)) {
        console.warn(`chat reply has ungrounded amount (attempt ${attempt})`);
        continue;
      }
      if (!contactsAreSafe(text, userText)) {
        console.warn(`chat reply has made-up contact number (attempt ${attempt})`);
        continue;
      }
      return formatWon(text);
    } catch (err) {
      console.error(`chat LLM call failed (attempt ${attempt})`, err);
    }
  }
  return null;
}
