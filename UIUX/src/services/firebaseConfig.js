// Firebase 연결 설정. 로컬 Expo 는 UIUX/.env 의 EXPO_PUBLIC_FIREBASE_* 값을 씁니다(.env 는 커밋하지 않음).
// Snack 은 .env 를 못 쓰므로, 시연할 때만 아래 빈 문자열 자리에 Firebase 콘솔의 웹 앱 설정값을 넣으세요.
// 값이 비어 있으면 아이디·비밀번호 로그인은 "설정이 없어요" 안내만 보여 주고, 나머지 로그인 방식은 그대로 동작합니다.
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

// 로컬 테스트용 Firebase 에뮬레이터 주소 (예: 127.0.0.1). 비워 두면 실제 Firebase 에 연결합니다.
export const firebaseEmulatorHost = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || '';
