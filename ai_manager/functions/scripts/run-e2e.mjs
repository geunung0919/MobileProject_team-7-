// Emulator 전체 흐름 테스트 실행기 (Windows / Mac 공용):  npm run e2e
// AI 정상(LLM_MOCK=1)과 AI 실패(LLM_MOCK=fail) 두 경우로 Emulator를 한 번씩 띄워 scripts/e2e.ts 를 실행한다.
// 실제 Firebase 프로젝트·배포·API 키가 필요 없다 (demo-jachi 프로젝트, Mock AI).
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const functionsDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = join(functionsDir, ".."); // firebase.json 이 있는 폴더
const envLocal = join(functionsDir, ".env.local"); // Functions Emulator 전용 환경변수

let failed = false;
for (const mock of ["1", "fail"]) {
  writeFileSync(envLocal, `LLM_MOCK=${mock}\n`);
  const cmd = `firebase emulators:exec --project demo-jachi --only auth,firestore,functions "cd functions && npx tsx scripts/e2e.ts --emulator"`;
  console.log(`\n▶ LLM_MOCK=${mock}  ${cmd}`);
  const r = spawnSync(cmd, { cwd: rootDir, shell: true, stdio: "inherit", env: { ...process.env, E2E_LLM_MOCK: mock } });
  if (r.status !== 0) failed = true;
}
writeFileSync(envLocal, "LLM_MOCK=1\n"); // 평소 Emulator 실행(npm run serve)은 Mock AI로
console.log(failed ? "\n❌ 실패한 항목이 있어요. 위 로그를 확인하세요." : "\n✅ Emulator 전체 흐름 테스트 모두 통과");
process.exit(failed ? 1 : 0);
