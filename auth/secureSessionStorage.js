import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSecureSessionStorage } from './secureSessionCore';

// Firebase 로그인 정보를 기기 보안 저장소에 저장하는 어댑터 (AC-02, iOS·Android 전용).
// firebase/firebaseConfig.js 에서 getReactNativePersistence(secureSessionStorage) 로 씁니다.
// 웹은 브라우저에 보안 저장소가 없어 Firebase 기본 브라우저 저장을 그대로 씁니다(시연용).
const secureSessionStorage = createSecureSessionStorage({
  secure: {
    getItemAsync: (key) => SecureStore.getItemAsync(key),
    setItemAsync: (key, value) => SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY, // 다른 기기로 백업 복원되지 않음
    }),
    deleteItemAsync: (key) => SecureStore.deleteItemAsync(key),
  },
  legacy: AsyncStorage, // 예전 일반 저장소의 로그인 정보는 옮기고 지움
});

export default secureSessionStorage;
