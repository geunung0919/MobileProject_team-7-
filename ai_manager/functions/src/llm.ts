// LLM 호출은 전부 이 파일을 거친다. (리포트 · 채팅 · 비상매뉴얼 · 레시피 · 주간 리포트 공용)
//
// 어느 AI를 쓸지 — 환경변수 LLM_PROVIDER
//   anthropic (기본)  Claude. 키: ANTHROPIC_API_KEY (Functions에서는 시크릿)
//   groq              Groq 무료 등급. 키: GROQ_API_KEY. 기본 모델 openai/gpt-oss-120b
//                     LLM_BASE_URL을 바꾸면 OpenAI 호환 서버 아무 데나 연결 가능 (OpenRouter, Ollama 등)
//   LLM_MODEL로 모델 이름을 직접 지정할 수 있다.
//
// Mock 모드 (API 없이 테스트) — 환경변수 LLM_MOCK
//   LLM_MOCK=1     실제 호출 없이 형식에 맞는 가짜 응답 반환 (검증 통과용)
//   LLM_MOCK=fail  항상 실패 → 재시도·fallback·이전 리포트 경로 테스트용
//   LLM_MOCK=bad   형식이 깨진 응답 → 응답 검증 실패 경로 테스트용
import Anthropic from "@anthropic-ai/sdk";
import { ChatTurn } from "./types";

const TIMEOUT_MS = 30_000;
// Groq 모델은 자주 바뀐다. 404(model_not_found)가 나면 npm run models 로 지금 쓸 수 있는 모델을 확인하고 LLM_MODEL 로 지정
const DEFAULT_MODEL = { anthropic: "claude-haiku-5-5", groq: "openai/gpt-oss-120b" } as const;
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const MAX_RATE_LIMIT_WAITS = 3; // 무료 등급 분당 한도(429)에 걸리면 기다렸다가 다시 시도하는 횟수
const MAX_WAIT_MS = 65_000;

// 환경변수는 호출할 때마다 읽는다 (eval이 .env.eval을 나중에 불러와도 반영되도록)
export function llmConfig() {
  const provider = (process.env.LLM_PROVIDER ?? "anthropic").toLowerCase() === "groq" ? "groq" : "anthropic";
  return { provider, model: process.env.LLM_MODEL ?? DEFAULT_MODEL[provider] } as const;
}
export const currentModel = () => `${llmConfig().provider}:${llmConfig().model}`;
/** @deprecated currentModel()을 쓰세요 */
export const MODEL = DEFAULT_MODEL.anthropic;

export interface LlmResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export async function askLlm(apiKey: string, system: string, messages: ChatTurn[], maxTokens: number): Promise<string> {
  return (await completeLlm(apiKey, system, messages, maxTokens)).text;
}

// 토큰 사용량까지 필요할 때 (eval)
export async function completeLlm(apiKey: string, system: string, messages: ChatTurn[], maxTokens: number): Promise<LlmResult> {
  const mock = process.env.LLM_MOCK;
  if (mock) return { text: mockReply(mock, system), inputTokens: 0, outputTokens: 0 };
  const { provider, model } = llmConfig();
  return provider === "groq"
    ? callOpenAiCompatible(process.env.GROQ_API_KEY || apiKey, model, system, messages, maxTokens)
    : callAnthropic(apiKey, model, system, messages, maxTokens);
}

// ---------- Claude ----------
let client: Anthropic | null = null;
let clientKey = "";
async function callAnthropic(apiKey: string, model: string, system: string, messages: ChatTurn[], maxTokens: number): Promise<LlmResult> {
  if (!client || clientKey !== apiKey) {
    client = new Anthropic({ apiKey, timeout: TIMEOUT_MS, maxRetries: 0 }); // 재시도는 호출 측에서 횟수 제한
    clientKey = apiKey;
  }
  const res = await client.messages.create({ model, max_tokens: maxTokens, system, messages });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  return { text, inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens };
}

// ---------- Groq (OpenAI 호환 형식) ----------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function callOpenAiCompatible(apiKey: string, model: string, system: string, messages: ChatTurn[], maxTokens: number): Promise<LlmResult> {
  if (!apiKey) throw new Error("GROQ_API_KEY가 없습니다.");
  const wantsJson = system.includes("JSON 객체 하나만 출력"); // 리포트·주간·레시피·비상매뉴얼 (채팅은 일반 문장)
  const body: Record<string, unknown> = {
    model,
    messages: [{ role: "system", content: system }, ...messages],
    max_completion_tokens: maxTokens,
    temperature: 0.4,
    // Claude는 프롬프트만으로 JSON을 잘 지키지만, 공개 모델은 앞뒤에 설명을 붙이는 경우가 많아 JSON 모드를 켠다
    ...(wantsJson ? { response_format: { type: "json_object" } } : {}),
  };
  if (model.includes("gpt-oss")) {
    // 추론(reasoning) 모델은 생각하는 데도 토큰을 써서, 답이 잘리지 않게 여유를 준다
    body.reasoning_effort = "low";
    body.max_completion_tokens = maxTokens + 2000;
  }

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${process.env.LLM_BASE_URL ?? GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status === 429 && attempt < MAX_RATE_LIMIT_WAITS) {
      // 무료 등급 분당 한도: 서버가 알려준 시간만큼 기다렸다가 다시 시도 (하루 한도면 기다려도 소용없으므로 포기)
      const waitMs = Math.ceil(Number(res.headers.get("retry-after") ?? "10") * 1000) + 500;
      if (waitMs > MAX_WAIT_MS) throw new Error(`Groq 한도 초과 (재시도까지 ${Math.round(waitMs / 1000)}초) — 하루 한도일 수 있어요.`);
      console.warn(`Groq 분당 한도 → ${Math.round(waitMs / 1000)}초 기다렸다가 다시 시도`);
      await sleep(waitMs);
      continue;
    }
    if (!res.ok) {
      const errText = (await res.text()).slice(0, 300);
      // JSON 모드를 지원하지 않는 모델이면 JSON 모드 없이 한 번 더 (프롬프트만으로 JSON 요청)
      if (res.status === 400 && body.response_format && /response_format|json/i.test(errText)) {
        delete body.response_format;
        continue;
      }
      throw Object.assign(new Error(`Groq 오류 ${res.status}: ${errText}`), { status: res.status });
    }
    const j: any = await res.json();
    const raw = String(j.choices?.[0]?.message?.content ?? "");
    const text = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim(); // 일부 모델의 생각 과정 제거
    return { text, inputTokens: j.usage?.prompt_tokens ?? 0, outputTokens: j.usage?.completion_tokens ?? 0 };
  }
}

// 가짜 응답: 숫자를 넣지 않아 숫자 검증을 항상 통과한다. 어느 기능인지는 시스템 프롬프트로 구분.
function mockReply(mode: string, system: string): string {
  if (mode === "fail") throw new Error("LLM_MOCK=fail: 모의 실패");
  if (mode === "bad") return "죄송해요, JSON이 아닌 응답입니다.";

  const recipeMark = "[재료·조리 조건]";
  if (system.includes("'AI 레시피'") && system.includes(recipeMark)) {
    // 조건 JSON을 읽어서 검증을 통과하는 레시피 1개를 만든다
    const ctx = JSON.parse(system.slice(system.lastIndexOf(recipeMark) + recipeMark.length));
    const item = ctx.inventory.find((i: { name: string }) => ctx.must_use.includes(i.name)) ?? ctx.inventory[0];
    return JSON.stringify({
      recipes: [
        {
          title: `[MOCK] ${item.name} 간단 요리`,
          minutes: Math.min(10, ctx.max_minutes),
          difficulty: "쉬움",
          tools: ctx.tools.length ? [ctx.tools[0].code] : [],
          ingredients: [{ name: item.name, quantity: item.quantity === null ? null : Math.min(1, item.quantity) }, { name: "소금", quantity: null }],
          steps: ["[MOCK] 재료를 손질해요.", "[MOCK] 조리해서 완성해요."],
        },
      ],
    });
  }

  if (system.includes("비상매뉴얼 AI")) {
    const id = system.match(/"faq_id":\s*"([^"]+)"/)?.[1];
    return JSON.stringify({ answer: "[MOCK] 안내된 순서대로 차분히 확인해 주세요.", faq_ids: id ? [id] : [] });
  }
  if (system.includes('"next_week_goal"')) {
    return JSON.stringify({
      weekly_summary: "[MOCK] 지난주 생활을 정리한 요약입니다.",
      good_point: "[MOCK] 잘한 점입니다.",
      improve_point: "[MOCK] 아쉬운 점입니다.",
      next_week_goal: "[MOCK] 다음 주 목표",
    });
  }
  if (system.includes('"today_message"')) {
    return JSON.stringify({
      today_message: "[MOCK] 오늘도 자취 생활을 잘 챙기고 있어요.",
      expense_summary: "[MOCK] 이번 달 소비 요약입니다.",
      inventory_summary: "[MOCK] 냉장고 재고 요약입니다.",
      routine_summary: "[MOCK] 생활 루틴 요약입니다.",
      actions: ["[MOCK] 냉장고 확인하기", "[MOCK] 영수증 등록하기"],
    });
  }
  return "[MOCK] 자취 매니저 답변입니다. 실제 답변은 API 연결 후 확인할 수 있어요.";
}
