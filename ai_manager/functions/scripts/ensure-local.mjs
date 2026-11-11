// Emulator용 로컬 설정 파일이 없으면 만든다 (git에는 올리지 않는 파일들이라 새로 받은 사람에게는 없음)
//   .secret.local : Emulator용 가짜 API 키   /  .env.local : Mock AI 켜기
import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = { ".secret.local": "ANTHROPIC_API_KEY=dummy-for-emulator\n", ".env.local": "LLM_MOCK=1\n" };
for (const [name, content] of Object.entries(files)) {
  const p = join(dir, name);
  if (!existsSync(p)) {
    writeFileSync(p, content);
    console.log(`${name} 를 만들었어요 (Emulator 전용, git에 올라가지 않음)`);
  }
}
