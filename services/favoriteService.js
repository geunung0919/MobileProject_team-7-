
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@solo_living_map_favorites_v1';

// 저장된 데이터에서 최소 식별정보만 추출
const normalizeFavorite = (item) => {
  if (!item || typeof item.id !== 'string' || !item.id.trim()) {
    return null;
  }

  return {
    id: item.id,
    savedAt:
      typeof item.savedAt === 'string'
        ? item.savedAt
        : new Date().toISOString(),
  };
};

// 즐겨찾기 ID 목록 불러오기
export const getFavorites = async () => {
  try {
    const saved = await AsyncStorage.getItem(FAVORITES_KEY);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    const seen = new Set();

    return parsed
      .map(normalizeFavorite)
      .filter((item) => {
        if (!item || seen.has(item.id)) return false;

        seen.add(item.id);
        return true;
      });
  } catch (error) {
    console.error('즐겨찾기 불러오기 실패:', error);
    throw error;
  }
};

// 즐겨찾기 저장
const saveFavorites = async (favorites) => {
  const minimalFavorites = favorites
    .map(normalizeFavorite)
    .filter(Boolean);

  await AsyncStorage.setItem(
    FAVORITES_KEY,
    JSON.stringify(minimalFavorites)
  );
};

// 즐겨찾기 여부 확인
export const isFavorite = async (placeId) => {
  const favorites = await getFavorites();

  return favorites.some((item) => item.id === placeId);
};

// 즐겨찾기 추가
export const addFavorite = async (place) => {
  if (!place?.id) {
    throw new Error('장소 ID가 없습니다.');
  }

  const favorites = await getFavorites();

  if (favorites.some((item) => item.id === place.id)) {
    return favorites;
  }

  const updated = [
    {
      id: place.id,
      savedAt: new Date().toISOString(),
    },
    ...favorites,
  ];

  await saveFavorites(updated);

  return updated;
};

// 즐겨찾기 해제
export const removeFavorite = async (placeId) => {
  const favorites = await getFavorites();

  const updated = favorites.filter(
    (item) => item.id !== placeId
  );

  await saveFavorites(updated);

  return updated;
};

// 즐겨찾기 추가 또는 해제
export const toggleFavorite = async (place) => {
  if (!place?.id) {
    throw new Error('장소 ID가 없습니다.');
  }

  const favorites = await getFavorites();

  const alreadyExists = favorites.some(
    (item) => item.id === place.id
  );

  if (alreadyExists) {
    const updated = favorites.filter(
      (item) => item.id !== place.id
    );

    await saveFavorites(updated);

    return {
      isFavorite: false,
      favorites: updated,
    };
  }

  const updated = [
    {
      id: place.id,
      savedAt: new Date().toISOString(),
    },
    ...favorites,
  ];

  await saveFavorites(updated);

  return {
    isFavorite: true,
    favorites: updated,
  };
};
