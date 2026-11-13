import { environment } from '../config/environment';

import { Platform } from "react-native";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  connectAuthEmulator,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
} from "firebase/firestore";

import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase Console → 프로젝트 설정 → 내 앱 → 구성
// 아래 값은 본인의 Firebase 웹 앱 설정값으로 교체
const firebaseConfig = {
  apiKey: "AIzaSyC1t_a9XCQdii6q0HcMXalw-znMDiRICtA",
  authDomain: "solo-living-ai.firebaseapp.com",
  projectId: "solo-living-ai",
  storageBucket: "solo-living-ai.firebasestorage.app",
  messagingSenderId: "634501862696",
  appId: "1:634501862696:web:e5d562d9ba0a9a91c8ac1d",
  measurementId: "G-8QTVKMEMQ3"
};

// Firebase 앱 중복 초기화 방지
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// React Native 로그인 상태를 AsyncStorage에 저장
let auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  if (error.code === "auth/already-initialized") {
    auth = getAuth(app);
  } else {
    throw error;
  }
}

// Firestore 연결
const db = getFirestore(app);

// 로컬 에뮬레이터 연결 여부
// 현재는 false로 두어 실제 서비스에 연결하지 않도록 함
const USE_EMULATOR = __DEV__ && environment.firebaseTarget === 'emulator';

// Android/iOS 실제 휴대폰에서 테스트할 때는
// 개발 PC의 LAN IP를 입력해야 함
const EMULATOR_HOST = environment.devHost;

if (__DEV__ && USE_EMULATOR) {
  connectAuthEmulator(
    auth,
    `http://${EMULATOR_HOST}:9099`,
    { disableWarnings: true }
  );

  connectFirestoreEmulator(
    db,
    EMULATOR_HOST,
    8080
  );
}

if (__DEV__) {
  console.log("[Firebase] 초기화 완료");
  console.log("[Firebase] 프로젝트:", app.options.projectId);
  console.log("[Firebase] Auth 초기화:", Boolean(auth));
  console.log("[Firebase] Firestore 초기화:", Boolean(db));
  console.log("[Firebase] 에뮬레이터 사용:", USE_EMULATOR);
}

export { app, auth, db, USE_EMULATOR };
