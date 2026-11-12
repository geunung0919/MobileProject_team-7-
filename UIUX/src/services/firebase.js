import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { firebaseConfig, firebaseEmulatorHost } from './firebaseConfig';

// Firebase 앱·인증·Firestore 를 한 번만 만듭니다. 설정값이 없으면 null 을 돌려줍니다.
// 앱(iOS·Android)은 로그인 유지를 AsyncStorage 에 저장하고, 웹은 브라우저 저장소를 씁니다.
let cached;

export const isFirebaseConfigured = () =>
  Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

export function getFirebase() {
  if (cached !== undefined) return cached;
  if (!isFirebaseConfigured()) { cached = null; return cached; }
  const fresh = getApps().length === 0;
  const app = fresh ? initializeApp(firebaseConfig) : getApp();
  let auth;
  if (fresh && Platform.OS !== 'web' && FirebaseAuth.getReactNativePersistence) {
    auth = FirebaseAuth.initializeAuth(app, { persistence: FirebaseAuth.getReactNativePersistence(AsyncStorage) });
  } else {
    auth = FirebaseAuth.getAuth(app);
  }
  const db = getFirestore(app);
  if (fresh && firebaseEmulatorHost) {
    FirebaseAuth.connectAuthEmulator(auth, `http://${firebaseEmulatorHost}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, firebaseEmulatorHost, 8080);
  }
  cached = { app, auth, db };
  return cached;
}

export function requireFirebase() {
  const fb = getFirebase();
  if (!fb) {
    const error = new Error('Firebase 연결 설정이 없어요.');
    error.code = 'app/not-configured';
    throw error;
  }
  return fb;
}
