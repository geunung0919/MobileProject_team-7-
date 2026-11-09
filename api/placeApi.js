
const SERVER_URL = 'http://10.0.2.2:3001';

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
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || fallbackMessage);
  }

  return data;
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

// 4. 주소 및 건물명 검색 (신규)
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
