
import { Platform } from 'react-native';

import {
  signInAnonymously,
  signOut,
} from 'firebase/auth';

import {
  auth,
  USE_EMULATOR,
} from '../firebase/firebaseConfig';

import { environment } from '../config/environment';

// ========================================
// 1. 서버 환경 설정
// ========================================

export const PLACE_API_MODE = environment.placeApiMode;

const COMPUTER_IP = environment.devHost;

const NODE_SERVER_URL =
  `http://${COMPUTER_IP}:3001`;

const FIREBASE_SERVER_URL =
  environment.firebaseTarget === 'cloud'
    ? environment.cloudApiBaseUrl
    : `http://${COMPUTER_IP}:5001/solo-living-ai/asia-northeast3/api`;

const REQUEST_TIMEOUT = 20000;

// 개발 에뮬레이터에서만 테스트 로그인 허용
const ENABLE_DEV_TEST_LOGIN = true;

const getServerUrl = () => {
  return PLACE_API_MODE === 'firebase'
    ? FIREBASE_SERVER_URL
    : NODE_SERVER_URL;
};

// ========================================
// 2. 검색 필터 기본값
// ========================================

export const DEFAULT_PLACE_FILTERS = {
  radius: 3000,
  openNow: false,
  minRating: 0,
  sort: 'open',
};

const buildFilterParams = (filters = {}) => {
  const options = {
    ...DEFAULT_PLACE_FILTERS,
    ...filters,
  };

  return (
    `&radius=${encodeURIComponent(options.radius)}` +
    `&openNow=${encodeURIComponent(options.openNow)}` +
    `&minRating=${encodeURIComponent(options.minRating)}` +
    `&sort=${encodeURIComponent(options.sort)}`
  );
};

// ========================================
// 3. Firebase 개발용 인증
// ========================================

// 모든 동시 API 요청이 하나의 토큰 발급/복구 작업 공유
let tokenPromise = null;

const canUseTestLogin = () => {
  return (
    __DEV__ &&
    USE_EMULATOR &&
    ENABLE_DEV_TEST_LOGIN
  );
};

const signInForTesting = async () => {
  if (!canUseTestLogin()) {
    throw new Error(
      '개발용 테스트 로그인은 Firebase 에뮬레이터에서만 사용할 수 있습니다.'
    );
  }

  console.log('[Firebase] 개발용 테스트 로그인 시작');

  const credential = await signInAnonymously(auth);

  console.log('[Firebase] 개발용 테스트 로그인 성공');

  return credential.user;
};

// 실제 토큰 발급 및 복구 처리
const acquireFirebaseIdToken = async () => {
  await auth.authStateReady();

  let user = auth.currentUser;

  // 로그인 상태가 없을 경우
  if (!user) {
    if (!canUseTestLogin()) {
      throw new Error(
        'Firebase 로그인이 필요합니다.'
      );
    }

    user = await signInForTesting();
  }

  try {
    return await user.getIdToken();
  } catch (error) {
    const recoverableCodes = [
      'auth/invalid-refresh-token',
      'auth/invalid-user-token',
      'auth/user-token-expired',
      'auth/user-not-found',
    ];

    const canRecover =
      canUseTestLogin() &&
      user.isAnonymous &&
      recoverableCodes.includes(error?.code);

    if (!canRecover) {
      throw error;
    }

    console.warn(
      '[Firebase] 이전 테스트 계정 토큰 무효화 감지'
    );

    // 그사이 다른 계정으로 변경됐다면
    // 이전 사용자로 로그아웃하지 않음
    const currentUser = auth.currentUser;

    if (
      currentUser &&
      currentUser.uid !== user.uid
    ) {
      return currentUser.getIdToken();
    }

    console.log('[Firebase] 인증 복구 시작');

    // 개발용 익명 로그인 상태만 초기화
    await signOut(auth);

    // 새 테스트 사용자 생성
    const newUser = await signInForTesting();

    const newToken = await newUser.getIdToken();

    console.log('[Firebase] 인증 복구 완료');

    return newToken;
  }
};

// 동시 요청을 하나의 인증 처리로 통합
const getFirebaseIdToken = async () => {
  if (tokenPromise) {
    return tokenPromise;
  }

  const pending = acquireFirebaseIdToken();

  tokenPromise = pending;

  try {
    return await pending;
  } finally {
    // 성공/실패와 관계없이 다음 인증 요청 허용
    if (tokenPromise === pending) {
      tokenPromise = null;
    }
  }
};

// ========================================
// 4. 서버 응답 공통 처리
// ========================================

const readResponse = async (path, fallbackMessage) => {
  const serverUrl = getServerUrl();
  const url = `${serverUrl}${path}`;

  const controller = new AbortController();
  let timer;

  try {
    const headers = {
      Accept: 'application/json',
    };

    // Firebase Functions에서만 인증 토큰 사용
    if (PLACE_API_MODE === 'firebase') {
      const token = await getFirebaseIdToken();

      headers.Authorization = `Bearer ${token}`;
    }

    console.log('[API] 사용 서버:', PLACE_API_MODE);
    console.log('[API] 요청:', url);
    console.log('[API] OS:', Platform.OS);

    timer = setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT);

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch (error) {
      throw new Error(
        `서버 응답이 JSON 형식이 아닙니다. HTTP ${response.status}`
      );
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          'Firebase 인증에 실패했습니다. 로그인 상태를 확인해 주세요.'
        );
      }

      throw new Error(
        data?.error ||
        data?.message ||
        `${fallbackMessage} (HTTP ${response.status})`
      );
    }

    console.log('[API] 응답 성공:', response.status);

    return data;
  } catch (error) {
    console.error(
      '[API] 요청 실패:',
      error?.message || error
    );

    if (controller.signal.aborted) {
      throw new Error(
        '서버 응답 시간이 초과되었습니다.\n' +
        `서버: ${serverUrl}\n` +
        '서버 실행 상태와 네트워크를 확인해 주세요.'
      );
    }

    if (
      error?.message === 'Network request failed' ||
      error?.message?.includes('fetch failed')
    ) {
      throw new Error(
        '서버에 연결할 수 없습니다.\n' +
        `서버: ${serverUrl}\n` +
        '컴퓨터와 휴대폰의 Wi-Fi 및 서버 실행 상태를 확인해 주세요.'
      );
    }

    throw error;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};

// ========================================
// 5. 카테고리별 주변 장소 검색
// ========================================

export const searchNearbyPlaces = async (
  latitude,
  longitude,
  category,
  filters = {}
) => {
  const path =
    '/places/nearby' +
    `?latitude=${encodeURIComponent(latitude)}` +
    `&longitude=${encodeURIComponent(longitude)}` +
    `&category=${encodeURIComponent(category)}` +
    buildFilterParams(filters);

  const data = await readResponse(
    path,
    '장소 검색에 실패했습니다.'
  );

  return data.places || [];
};

// ========================================
// 6. 특정 장소 상세정보 조회
// ========================================

export const getPlaceDetails = async (placeId) => {
  if (!placeId) {
    throw new Error('장소 ID가 필요합니다.');
  }

  const path =
    '/places/details' +
    `?id=${encodeURIComponent(placeId)}`;

  const data = await readResponse(
    path,
    '장소 상세정보 조회에 실패했습니다.'
  );

  return data.place;
};

// ========================================
// 7. 검색어 기반 장소 검색
// ========================================

export const searchPlacesByText = async (
  latitude,
  longitude,
  query,
  filters = {}
) => {
  const keyword = query.trim();

  if (keyword.length < 2) {
    throw new Error(
      '검색어는 2글자 이상 입력해주세요.'
    );
  }

  const path =
    '/places/search' +
    `?latitude=${encodeURIComponent(latitude)}` +
    `&longitude=${encodeURIComponent(longitude)}` +
    `&query=${encodeURIComponent(keyword)}` +
    buildFilterParams(filters);

  const data = await readResponse(
    path,
    '장소 이름 검색에 실패했습니다.'
  );

  return data.places || [];
};

// ========================================
// 8. 주소 및 건물명 검색
// ========================================

export const searchAddresses = async (query) => {
  const keyword = query.trim();

  if (keyword.length < 2) {
    throw new Error(
      '주소는 2글자 이상 입력해주세요.'
    );
  }

  const path =
    '/places/address-search' +
    `?query=${encodeURIComponent(keyword)}`;

  const data = await readResponse(
    path,
    '주소 검색에 실패했습니다.'
  );

  return data.addresses || [];
};
