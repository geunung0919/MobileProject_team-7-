// Groq에서 지금 쓸 수 있는 모델 목록:  npm run models   (키는 .env.eval 의 GROQ_API_KEY)
import { existsSync, readFileSync } from "node:fs";
if (existsSync(".env.eval")) {
  for (const line of readFileSync(".env.eval", "utf-8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith("#") && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}
const key = process.env.GROQ_API_KEY;
if (!key) {
  console.error("GROQ_API_KEY가 없어요. functions/.env.eval 에 적어 주세요.");
  process.exit(1);
}
(async () => {
  const res = await fetch(`${process.env.LLM_BASE_URL ?? "https://api.groq.com/openai/v1"}/models`, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) {
    console.error(`오류 ${res.status}: ${(await res.text()).slice(0, 200)}`);
    process.exit(1);
  }
  const j: any = await res.json();
  const ids: string[] = (j.data ?? []).filter((m: any) => m.active !== false).map((m: any) => m.id).sort();
  const text = ids.filter((id) => !/whisper|tts|orpheus|guard|playai|distil/i.test(id)); // 음성·안전 분류 모델 제외
  console.log("텍스트 모델 (이 중 하나를 .env.eval 의 LLM_MODEL= 에 적으세요):");
  text.forEach((id) => console.log(`  ${id}`));
  console.log("\n추천: openai/gpt-oss-120b (없으면 이름에 llama, qwen, gpt-oss 가 들어간 큰 모델)");
})();
