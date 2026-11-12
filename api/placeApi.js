
import { Platform } from 'react-native';

// 개발 컴퓨터의 LAN IP
// 컴퓨터의 IP가 변경되면 이 값도 수정해야 합니다.
const COMPUTER_IP = '192.168.123.107';
const SERVER_PORT = 3001;

// Android / iOS 실제 기기는 동일한 LAN IP 사용
// Android 에뮬레이터에서도 LAN IP로 접속할 수 있도록 구성
const SERVER_URL =
  `http://${COMPUTER_IP}:${SERVER_PORT}`;

// 요청 제한 시간 (20초)
const REQUEST_TIMEOUT = 20000;

// 검색 필터 기본값
export const DEFAULT_PLACE_FILTERS = {
  radius: 3000,
  openNow: false,
  minRating: 0,
  sort: 'open',
};

// 필터 조건을 URL 파라미터로 변환
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

// 서버 응답 공통 처리
const readResponse = async (url, fallbackMessage) => {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT);

  try {
    console.log('[API] 요청:', url);
    console.log('[API] OS:', Platform.OS);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
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
      throw new Error(
        data?.error ||
        `${fallbackMessage} (HTTP ${response.status})`
      );
    }

    console.log('[API] 응답 성공:', response.status);

    return data;
  } catch (error) {
    console.error('[API] 요청 실패:', error.message);

    if (controller.signal.aborted) {
      throw new Error(
        '서버 응답 시간이 초과되었습니다. 서버 실행 상태와 네트워크를 확인해 주세요.'
      );
    }

    if (
      error.message === 'Network request failed' ||
      error.message.includes('fetch failed')
    ) {
      throw new Error(
        `서버에 연결할 수 없습니다.\n` +
        `서버: ${SERVER_URL}\n` +
        '컴퓨터와 휴대폰의 Wi-Fi 및 백엔드 서버 실행 상태를 확인해 주세요.'
      );
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
};

// 1. 카테고리별 주변 장소 검색
export const searchNearbyPlaces = async (
  latitude,
  longitude,
  category,
  filters = {}
) => {
  const url =
    `${SERVER_URL}/places/nearby` +
    `?latitude=${encodeURIComponent(latitude)}` +
    `&longitude=${encodeURIComponent(longitude)}` +
    `&category=${encodeURIComponent(category)}` +
    buildFilterParams(filters);

  const data = await readResponse(
    url,
    '장소 검색에 실패했습니다.'
  );

  return data.places || [];
};

// 2. 특정 장소 상세정보 조회
export const getPlaceDetails = async (placeId) => {
  if (!placeId) {
    throw new Error('장소 ID가 필요합니다.');
  }

  const url =
    `${SERVER_URL}/places/details` +
    `?id=${encodeURIComponent(placeId)}`;

  const data = await readResponse(
    url,
    '장소 상세정보 조회에 실패했습니다.'
  );

  return data.place;
};

// 3. 검색어 기반 실제 장소 검색
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

  const url =
    `${SERVER_URL}/places/search` +
    `?latitude=${encodeURIComponent(latitude)}` +
    `&longitude=${encodeURIComponent(longitude)}` +
    `&query=${encodeURIComponent(keyword)}` +
    buildFilterParams(filters);

  const data = await readResponse(
    url,
    '장소 이름 검색에 실패했습니다.'
  );

  return data.places || [];
};

// 4. 주소 및 건물명 검색
export const searchAddresses = async (query) => {
  const keyword = query.trim();

  if (keyword.length < 2) {
    throw new Error(
      '주소는 2글자 이상 입력해주세요.'
    );
  }

  const url =
    `${SERVER_URL}/places/address-search` +
    `?query=${encodeURIComponent(keyword)}`;

  const data = await readResponse(
    url,
    '주소 검색에 실패했습니다.'
  );

  return data.addresses || [];
};
