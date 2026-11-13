import { getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';

// Firebase 연결 (AI 자취 매니저 서버 호출용).
// - .env 에 EXPO_PUBLIC_FIREBASE_PROJECT_ID 가 없으면 서버를 쓰지 않고, 화면은 지금처럼 더미 데이터로 동작합니다.
// - EXPO_PUBLIC_USE_EMULATOR=true 면 내 컴퓨터의 Firebase Emulator 에 연결합니다 (Mock AI, API 키 불필요).
// - 로그인은 팀의 로그인 기능이 맡습니다. Emulator 에서만 테스트용 익명 로그인을 자동으로 합니다.
// 설정: UIUX 폴더의 .env.example 을 .env 로 복사해서 사용 (.env 는 git 에 올라가지 않음).

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
const REGION = 'asia-northeast3'; // 서버 함수 지역 (functions/src/index.ts 와 같아야 함)
const USE_EMULATOR = process.env.EXPO_PUBLIC_USE_EMULATOR === 'true';
// 휴대폰·Expo Go 에서는 localhost 가 폰 자신이므로, 개발 PC 의 IP(예: 192.168.0.10)를 넣으세요.
const EMULATOR_HOST = process.env.EXPO_PUBLIC_EMULATOR_HOST || '127.0.0.1';

export const isAiServerEnabled = Boolean(config.projectId);

let cached = null;
function connect() {
  if (cached) return cached;
  const app = getApps()[0] ?? initializeApp({ ...config, apiKey: config.apiKey || 'emulator-key' });
  const auth = getAuth(app);
  const functions = getFunctions(app, REGION);
  if (USE_EMULATOR) {
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, { disableWarnings: true });
    connectFunctionsEmulator(functions, EMULATOR_HOST, 5001);
  }
  cached = { auth, functions };
  return cached;
}

// 서버 함수 호출. 실패하면 Error 를 던집니다 (error.code: 'functions/unauthenticated' 등).
export async function callAi(name, data = {}) {
  if (!isAiServerEnabled) throw new Error('AI 서버가 설정되지 않았어요 (.env 의 EXPO_PUBLIC_FIREBASE_PROJECT_ID).');
  const { auth, functions } = connect();
  if (USE_EMULATOR && !auth.currentUser) await signInAnonymously(auth); // Emulator 테스트용
  const result = await httpsCallable(functions, name)(data);
  return result.data;
}
