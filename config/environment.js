
const firebaseTarget =
  process.env.EXPO_PUBLIC_FIREBASE_TARGET || 'emulator';

const placeApiMode =
  process.env.EXPO_PUBLIC_PLACE_API_MODE || 'firebase';

const devHost =
  process.env.EXPO_PUBLIC_DEV_HOST || '';

const cloudApiBaseUrl =
  process.env.EXPO_PUBLIC_CLOUD_API_BASE_URL || '';

if (!['emulator', 'cloud'].includes(firebaseTarget)) {
  throw new Error('Firebase 환경 설정이 올바르지 않습니다.');
}

if (!['node', 'firebase'].includes(placeApiMode)) {
  throw new Error('지도 API 모드가 올바르지 않습니다.');
}

if (__DEV__ && firebaseTarget === 'emulator' && !devHost) {
  throw new Error(
    'EXPO_PUBLIC_DEV_HOST가 없습니다. ' +
    'scripts/start-dev.ps1로 Expo를 실행해 주세요.'
  );
}

if (!__DEV__ && firebaseTarget !== 'cloud') {
  throw new Error(
    '배포 빌드에서 Firebase 에뮬레이터를 사용할 수 없습니다.'
  );
}

export const environment = {
  firebaseTarget,
  placeApiMode,
  devHost,
  cloudApiBaseUrl,
};
