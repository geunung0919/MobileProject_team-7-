import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 로그인 세션 저장소 (요구사항 AC-02, AC-10).
// - iOS·Android: expo-secure-store (iOS Keychain / Android Keystore 기반 암호화 저장소)
// - 웹 미리보기: 브라우저에는 안전 저장소가 없어 AsyncStorage(localStorage)를 씁니다. 웹은 시연용으로만 쓰세요.
// 토큰 값은 화면·로그에 출력하지 않습니다.
const KEY = 'jachwi.auth.session'; // SecureStore 키는 영문·숫자·.-_ 만 허용
const LEGACY_KEY = 'jachwi:auth:session'; // 이전 버전(AsyncStorage) 키

const secure = Platform.OS !== 'web';

async function readRaw() {
  if (!secure) return AsyncStorage.getItem(KEY);
  const value = await SecureStore.getItemAsync(KEY);
  if (value) return value;
  // 이전 버전이 AsyncStorage 에 남긴 세션이 있으면 안전 저장소로 옮기고 지웁니다.
  const legacy = await AsyncStorage.getItem(LEGACY_KEY);
  if (legacy) {
    await SecureStore.setItemAsync(KEY, legacy);
    await AsyncStorage.removeItem(LEGACY_KEY);
  }
  return legacy;
}

export async function loadSession() {
  try { return JSON.parse((await readRaw()) || 'null'); } catch { return null; }
}

export async function saveSession(session) {
  const value = JSON.stringify(session);
  if (secure) await SecureStore.setItemAsync(KEY, value);
  else await AsyncStorage.setItem(KEY, value);
}

export async function clearSession() {
  try {
    if (secure) await SecureStore.deleteItemAsync(KEY);
    await AsyncStorage.removeItem(secure ? LEGACY_KEY : KEY);
  } catch { /* 지울 값이 없으면 무시 */ }
}

export const sessionStorageKind = secure ? 'secure' : 'web';
