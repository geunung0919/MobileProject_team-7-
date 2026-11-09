
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@solo_living_map_search_history_v1';
const MAX_HISTORY = 10;

const normalizeHistory = (items) => {
  if (!Array.isArray(items)) return [];

  return items.filter(
    (item) =>
      item &&
      typeof item.id === 'string' &&
      typeof item.query === 'string' &&
      ['place', 'address'].includes(item.type)
  );
};

// 전체 검색 기록 불러오기
export const getSearchHistory = async () => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    return normalizeHistory(JSON.parse(saved));
  } catch (error) {
    console.error('검색 기록 불러오기 실패:', error);
    return [];
  }
};

// 검색 기록 추가
export const addSearchHistory = async (query, type = 'place') => {
  const keyword = String(query || '').trim();

  if (keyword.length < 2) {
    return getSearchHistory();
  }

  if (!['place', 'address'].includes(type)) {
    throw new Error('지원하지 않는 검색 유형입니다.');
  }

  const history = await getSearchHistory();

  const filtered = history.filter(
    (item) =>
      !(
        item.type === type &&
        item.query.toLowerCase() === keyword.toLowerCase()
      )
  );

  const newItem = {
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    query: keyword,
    type,
    searchedAt: new Date().toISOString(),
  };

  const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updated)
  );

  return updated;
};

// 검색 기록 개별 삭제
export const removeSearchHistory = async (id) => {
  const history = await getSearchHistory();

  const updated = history.filter(
    (item) => item.id !== id
  );

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updated)
  );

  return updated;
};

// 검색 기록 전체 삭제
export const clearSearchHistory = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
  return [];
};
