import { buildEmergencySystem, parseEmergency } from "./emergencyRules";
import { askLlm } from "./llm";
import { ChatTurn, EmergencyFaq } from "./types";

const MAX_ATTEMPTS = 2;

// 성공하면 검증된 {answer, faq_ids}, 실패하면 null (호출 측에서 FAQ 원문을 그대로 보여줌)
export async function answerEmergency(
  apiKey: string,
  faqs: EmergencyFaq[],
  history: ChatTurn[],
  message: string
): Promise<{ answer: string; faq_ids: string[] } | null> {
  const system = buildEmergencySystem(faqs);
  const userText = [...history.map((h) => h.content), message].join("\n");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const text = await askLlm(apiKey, system, [...history, { role: "user", content: message }], 500);
      const parsed = parseEmergency(text, faqs, userText);
      if (parsed) return parsed;
      console.warn(`emergency reply validation failed (attempt ${attempt})`);
    } catch (err) {
      console.error(`emergency LLM call failed (attempt ${attempt})`, err);
    }
  }
  return null;
}
