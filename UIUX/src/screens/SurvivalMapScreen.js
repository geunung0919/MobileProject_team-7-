
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
  ScrollView,
  FlatList,
  Modal,
  Keyboard,
  TextInput,
  PanResponder,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SearchBar from '../components/SearchBar';
import CategoryTabs from '../components/CategoryTabs';
import PlaceResultCard from '../components/PlaceResultCard';
import { colors, fonts, emergencyColors as c } from '../theme';

import {
  DEFAULT_PLACE_FILTERS,
  searchNearbyPlaces,
  searchPlacesByText,
  getPlaceDetails,
  searchAddresses,
} from '../../../api/placeApi';

import {
  getFavorites,
  toggleFavorite,
  removeFavorite,
} from '../../../services/favoriteService';

import {
  getSearchHistory,
  addSearchHistory,
  removeSearchHistory,
  clearSearchHistory,
} from '../../../services/searchHistoryService';

const INITIAL_LOCATION = {
  latitude: 36.8002,
  longitude: 127.0749,
};

const CATEGORIES = [
  { id: 'restaurant', label: '음식점', icon: 'silverware-fork-knife' },
  { id: 'cafe', label: '카페', icon: 'coffee-outline' },
  { id: 'convenience', label: '편의점', icon: 'store-outline' },
  { id: 'mart', label: '마트', icon: 'cart-outline' },
  { id: 'hospital', label: '병원', icon: 'hospital-box-outline' },
  { id: 'laundry', label: '세탁소', icon: 'washing-machine' },
];

const RADIUS_OPTIONS = [
  { label: '1km', value: 1000 },
  { label: '3km', value: 3000 },
  { label: '5km', value: 5000 },
];

const RATING_OPTIONS = [
  { label: '전체', value: 0 },
  { label: '3.5 이상', value: 3.5 },
  { label: '4.0 이상', value: 4 },
];

const SORT_OPTIONS = [
  { label: '영업 중 우선', value: 'open' },
  { label: '가까운 순', value: 'distance' },
  { label: '평점 높은 순', value: 'rating' },
];

function isValidCoordinate(place) {
  return (
    Number.isFinite(place?.latitude) &&
    Number.isFinite(place?.longitude)
  );
}

function formatDistance(distance) {
  if (
    distance == null ||
    !Number.isFinite(Number(distance))
  ) {
    return '정보 없음';
  }

  const meters = Number(distance);

  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)}km`
    : `${Math.round(meters)}m`;
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const rad = (value) => (value * Math.PI) / 180;

  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) *
      Math.cos(rad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return Math.round(
    6371000 *
      2 *
      Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

function FilterOption({ label, selected, onPress }) {
  return (
    <Pressable
      style={[
        styles.optionButton,
        selected && styles.optionButtonSelected,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.optionText,
          selected && styles.optionTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function SurvivalMapScreen() {
  const insets = useSafeAreaInsets();

  const mapRef = useRef(null);
  const searchRequestRef = useRef(0);
  const detailsRequestRef = useRef(0);
  const favoritesRequestRef = useRef(0);
  const markersRequestRef = useRef(0);
  const addressRequestRef = useRef(0);
  const favoriteBusyRef = useRef(false);
  const favoriteCacheRef = useRef(new Map());

  const [selectedLocation, setSelectedLocation] =
    useState(INITIAL_LOCATION);

  const [categoryId, setCategoryId] = useState(null);
  const [query, setQuery] = useState('');

  // 주소 검색
  const [addressQuery, setAddressQuery] = useState('');
  const [addressResults, setAddressResults] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressVisible, setAddressVisible] = useState(false);

  // 검색 기록
  const [historyVisible, setHistoryVisible] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  // 필터
  const [filters, setFilters] = useState({
    ...DEFAULT_PLACE_FILTERS,
  });

  const [draftFilters, setDraftFilters] = useState({
    ...DEFAULT_PLACE_FILTERS,
  });

  const [filterVisible, setFilterVisible] = useState(false);

  // 장소 검색
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listMode, setListMode] = useState('hidden');

  // 장소 상세정보
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // 상세정보 바텀시트
  const [sheetExpanded, setSheetExpanded] = useState(false);

  // 즐겨찾기
  const [favorites, setFavorites] = useState([]);
  const [favoritesReady, setFavoritesReady] = useState(false);
  const [favoriteSaving, setFavoriteSaving] = useState(false);
  const [favoriteMarkers, setFavoriteMarkers] = useState([]);
  const [favoritesVisible, setFavoritesVisible] = useState(false);
  const [favoritePlaces, setFavoritePlaces] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  // 상세정보 손잡이 드래그
  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,

      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 5,

      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -45) {
          setSheetExpanded(true);
        } else if (gestureState.dy > 45) {
          setSheetExpanded(false);
        }
      },

      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const keyword = query.trim();
  const isTextSearch = keyword.length >= 2;
  const hasSearch = isTextSearch || Boolean(categoryId);

  const currentCategory = CATEGORIES.find(
    (category) => category.id === categoryId
  );

  const filterActive =
    filters.radius !== DEFAULT_PLACE_FILTERS.radius ||
    filters.openNow !== DEFAULT_PLACE_FILTERS.openNow ||
    filters.minRating !== DEFAULT_PLACE_FILTERS.minRating ||
    filters.sort !== DEFAULT_PLACE_FILTERS.sort;

  const displayedPlace = {
    ...(selectedPlace || {}),
    ...(placeDetails || {}),
  };

  const selectedIsFavorite = favorites.some(
    (item) => item.id === selectedPlace?.id
  );

  const bottomOffset = Math.max(insets.bottom, 12) + 8;

  const searchPlaceIds = new Set(
    places.map((place) => place.id)
  );

  const visibleFavoriteMarkers = favoriteMarkers.filter(
    (place) =>
      isValidCoordinate(place) &&
      !searchPlaceIds.has(place.id)
  );

  // 검색 기록 불러오기
  useEffect(() => {
    let active = true;

    getSearchHistory()
      .then((items) => {
        if (active) {
          setSearchHistory(items);
        }
      })
      .catch((error) => {
        console.error('검색 기록 불러오기 오류:', error);
      });

    return () => {
      active = false;
    };
  }, []);

  const saveHistory = async (term, type) => {
    try {
      const updated = await addSearchHistory(term, type);
      setSearchHistory(updated);
    } catch (error) {
      console.error('검색 기록 저장 오류:', error);
    }
  };

  const handleRemoveHistory = async (id) => {
    try {
      const updated = await removeSearchHistory(id);
      setSearchHistory(updated);
    } catch (error) {
      Alert.alert(
        '삭제 실패',
        error.message || '검색 기록을 삭제하지 못했습니다.'
      );
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      '검색 기록 전체 삭제',
      '모든 검색 기록을 삭제할까요?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await clearSearchHistory();
              setSearchHistory(updated);
            } catch (error) {
              Alert.alert(
                '삭제 실패',
                error.message || '삭제하지 못했습니다.'
              );
            }
          },
        },
      ]
    );
  };

  const handleHistoryPress = (item) => {
    setHistoryVisible(false);

    if (item.type === 'address') {
      setAddressVisible(true);
      setAddressQuery(item.query);
      setAddressResults([]);
      handleAddressSearch(item.query);
    } else {
      setAddressVisible(false);
      setCategoryId(null);
      setQuery(item.query);
    }

    Keyboard.dismiss();
  };

  // 즐겨찾기 불러오기
  useEffect(() => {
    let active = true;

    const loadFavorites = async () => {
      try {
        const saved = await getFavorites();

        if (active) {
          setFavorites(saved);
        }
      } catch (error) {
        console.error('즐겨찾기 불러오기 실패:', error);
      } finally {
        if (active) {
          setFavoritesReady(true);
        }
      }
    };

    loadFavorites();

    return () => {
      active = false;
    };
  }, []);

  // 즐겨찾기 마커 정보 불러오기
  useEffect(() => {
    if (!favoritesReady) {
      return;
    }

    const requestId = ++markersRequestRef.current;

    const loadMarkers = async () => {
      const ids = favorites.map((item) => item.id);

      if (ids.length === 0) {
        setFavoriteMarkers([]);
        return;
      }

      const cache = favoriteCacheRef.current;

      const missingIds = ids.filter(
        (id) => !cache.has(id)
      );

      for (
        let index = 0;
        index < missingIds.length;
        index += 3
      ) {
        const batch = missingIds.slice(index, index + 3);

        const results = await Promise.allSettled(
          batch.map((id) => getPlaceDetails(id))
        );

        if (requestId !== markersRequestRef.current) {
          return;
        }

        results.forEach((result, resultIndex) => {
          if (
            result.status === 'fulfilled' &&
            result.value &&
            isValidCoordinate(result.value)
          ) {
            const id = batch[resultIndex];

            cache.set(id, {
              ...result.value,
              id,
            });
          }
        });
      }

      if (requestId !== markersRequestRef.current) {
        return;
      }

      setFavoriteMarkers(
        ids
          .filter((id) => cache.has(id))
          .map((id) => cache.get(id))
      );
    };

    loadMarkers().catch((error) => {
      console.error('즐겨찾기 마커 조회 실패:', error);
    });

    return () => {
      markersRequestRef.current += 1;
    };
  }, [favorites, favoritesReady]);

  // 상세정보 닫기
  const closeDetails = () => {
    detailsRequestRef.current += 1;

    setSelectedPlace(null);
    setPlaceDetails(null);
    setDetailsLoading(false);
    setDetailsError(null);
    setShowDetails(false);

    // 상세정보를 닫으면 크기도 초기화
    setSheetExpanded(false);
  };

  const openFilters = () => {
    Keyboard.dismiss();
    setDraftFilters({ ...filters });
    setFilterVisible(true);
  };

  const applyFilters = () => {
    setFilters({ ...draftFilters });
    setFilterVisible(false);
    Keyboard.dismiss();
  };

  const handleSelectCategory = (id) => {
    setCategoryId(categoryId === id ? null : id);
    setQuery('');
    Keyboard.dismiss();
  };

  const closeAddressSearch = () => {
    addressRequestRef.current += 1;
    setAddressVisible(false);
    setAddressLoading(false);
    Keyboard.dismiss();
  };

  // 주소 검색
  const handleAddressSearch = async (overrideQuery = null) => {
    const term =
      typeof overrideQuery === 'string'
        ? overrideQuery
        : addressQuery;

    const searchTerm = term.trim();

    if (searchTerm.length < 2) {
      Alert.alert(
        '주소 검색',
        '주소 또는 건물명을 2글자 이상 입력해주세요.'
      );
      return;
    }

    const requestId = ++addressRequestRef.current;

    Keyboard.dismiss();
    setAddressLoading(true);
    setAddressResults([]);

    try {
      const results = await searchAddresses(searchTerm);

      if (requestId !== addressRequestRef.current) {
        return;
      }

      setAddressResults(results);

      await saveHistory(searchTerm, 'address');

      if (results.length === 0) {
        Alert.alert(
          '검색 결과 없음',
          '다른 주소 또는 건물명으로 검색해 보세요.'
        );
      }
    } catch (error) {
      if (requestId === addressRequestRef.current) {
        Alert.alert(
          '주소 검색 실패',
          error.message || '주소 검색에 실패했습니다.'
        );
      }
    } finally {
      if (requestId === addressRequestRef.current) {
        setAddressLoading(false);
      }
    }
  };

  // 주소 선택 후 지도 이동
  const handleSelectAddress = (item) => {
    if (!isValidCoordinate(item)) {
      return;
    }

    closeAddressSearch();

    setAddressQuery(item.address || item.name);
    setAddressResults([]);
    setCategoryId(null);
    setQuery('');

    closeDetails();
    setListMode('hidden');

    setSelectedLocation({
      latitude: item.latitude,
      longitude: item.longitude,
    });

    mapRef.current?.animateToRegion(
      {
        latitude: item.latitude,
        longitude: item.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      650
    );
  };

  // 지도 터치 시 기준 위치 변경
  const handleMapPress = (event) => {
    if (
      event.nativeEvent.action === 'marker-press' ||
      event.nativeEvent.action === 'poi-click'
    ) {
      return;
    }

    const coordinate = event.nativeEvent.coordinate;

    if (!coordinate) {
      return;
    }

    closeDetails();
    setListMode('hidden');

    setSelectedLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });

    Keyboard.dismiss();
  };

  // 장소 검색
  useEffect(() => {
    const requestId = ++searchRequestRef.current;

    setPlaces([]);
    setLoading(false);
    setListMode('hidden');
    closeDetails();

    if (!hasSearch) {
      return;
    }

    let timer;

    const loadPlaces = async () => {
      try {
        setLoading(true);

        const results = isTextSearch
          ? await searchPlacesByText(
              selectedLocation.latitude,
              selectedLocation.longitude,
              keyword,
              filters
            )
          : await searchNearbyPlaces(
              selectedLocation.latitude,
              selectedLocation.longitude,
              categoryId,
              filters
            );

        if (requestId !== searchRequestRef.current) {
          return;
        }

        setPlaces(results);

        if (isTextSearch) {
          await saveHistory(keyword, 'place');
        }

        setListMode(
          results.length > 0 ? 'expanded' : 'hidden'
        );
      } catch (error) {
        if (requestId !== searchRequestRef.current) {
          return;
        }

        setListMode('hidden');

        Alert.alert(
          '장소 검색 실패',
          error.message || '검색 중 오류가 발생했습니다.'
        );
      } finally {
        if (requestId === searchRequestRef.current) {
          setLoading(false);
        }
      }
    };

    if (isTextSearch) {
      timer = setTimeout(loadPlaces, 600);
    } else {
      loadPlaces();
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }

      searchRequestRef.current += 1;
    };
  }, [
    keyword,
    categoryId,
    selectedLocation.latitude,
    selectedLocation.longitude,
    filters.radius,
    filters.openNow,
    filters.minRating,
    filters.sort,
  ]);

  // 검색 결과 지도 표시
  useEffect(() => {
    if (places.length === 0) {
      return;
    }

    const coordinates = [
      selectedLocation,
      ...places
        .filter(isValidCoordinate)
        .map((place) => ({
          latitude: place.latitude,
          longitude: place.longitude,
        })),
    ];

    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 45,
          right: 45,
          bottom: 140,
          left: 45,
        },
        animated: true,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [places]);

  // 장소 상세정보 열기
  const openPlaceDetails = async (place) => {
    if (!place?.id) {
      return;
    }

    Keyboard.dismiss();

    setFavoritesVisible(false);
    favoritesRequestRef.current += 1;
    setListMode('collapsed');

    const requestId = ++detailsRequestRef.current;

    setSelectedPlace(place);
    setPlaceDetails(null);
    setDetailsError(null);
    setDetailsLoading(true);

    // 새로운 장소를 클릭하면 40% 크기로 열기
    setSheetExpanded(false);
    setShowDetails(true);

    try {
      const details = await getPlaceDetails(place.id);

      if (requestId !== detailsRequestRef.current) {
        return;
      }

      setPlaceDetails(details);

      if (
        favorites.some((item) => item.id === place.id) &&
        isValidCoordinate(details)
      ) {
        favoriteCacheRef.current.set(place.id, {
          ...details,
          id: place.id,
        });
      }
    } catch (error) {
      if (requestId !== detailsRequestRef.current) {
        return;
      }

      setDetailsError(error.message);
    } finally {
      if (requestId === detailsRequestRef.current) {
        setDetailsLoading(false);
      }
    }
  };

  // 지도에 표시된 Google 기본 장소 선택
  const handlePoiClick = (event) => {
    const poi = event.nativeEvent;

    if (!poi?.placeId) {
      return;
    }

    const latitude = poi.coordinate?.latitude;
    const longitude = poi.coordinate?.longitude;

    const hasCoordinates =
      Number.isFinite(latitude) &&
      Number.isFinite(longitude);

    const distance = hasCoordinates
      ? calculateDistance(
          selectedLocation.latitude,
          selectedLocation.longitude,
          latitude,
          longitude
        )
      : null;

    openPlaceDetails({
      id: poi.placeId,
      name: poi.name || '선택한 장소',
      address: '',
      latitude: hasCoordinates ? latitude : null,
      longitude: hasCoordinates ? longitude : null,
      distance,
    });
  };

  const handleCloseDetails = () => {
    closeDetails();

    setListMode(
      places.length > 0 ? 'collapsed' : 'hidden'
    );
  };

  // 즐겨찾기 추가 및 해제
  const handleToggleFavorite = async () => {
    if (
      !selectedPlace?.id ||
      favoriteBusyRef.current
    ) {
      return;
    }

    favoriteBusyRef.current = true;
    setFavoriteSaving(true);

    const placeId = selectedPlace.id;

    try {
      const result = await toggleFavorite({
        id: placeId,
      });

      if (result.isFavorite) {
        if (isValidCoordinate(displayedPlace)) {
          favoriteCacheRef.current.set(placeId, {
            ...displayedPlace,
            id: placeId,
          });
        }
      } else {
        favoriteCacheRef.current.delete(placeId);

        setFavoriteMarkers((prev) =>
          prev.filter((item) => item.id !== placeId)
        );

        setFavoritePlaces((prev) =>
          prev.filter((item) => item.id !== placeId)
        );
      }

      setFavorites(result.favorites);
    } catch (error) {
      Alert.alert(
        '즐겨찾기 오류',
        error.message || '즐겨찾기 저장에 실패했습니다.'
      );
    } finally {
      favoriteBusyRef.current = false;
      setFavoriteSaving(false);
    }
  };

  // 즐겨찾기 장소 선택
  const handleSelectFavoritePlace = async (place) => {
    if (!place?.id) {
      return;
    }

    let targetPlace = place;

    if (!isValidCoordinate(targetPlace)) {
      try {
        const details = await getPlaceDetails(place.id);

        targetPlace = {
          ...place,
          ...details,
          id: place.id,
        };

        if (isValidCoordinate(targetPlace)) {
          favoriteCacheRef.current.set(
            place.id,
            targetPlace
          );
        }
      } catch (error) {
        console.error(
          '즐겨찾기 장소 좌표 조회 실패:',
          error
        );
      }
    }

    if (isValidCoordinate(targetPlace)) {
      mapRef.current?.animateToRegion(
        {
          latitude: targetPlace.latitude,
          longitude: targetPlace.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        },
        600
      );
    }

    openPlaceDetails(targetPlace);
  };

  // 즐겨찾기 목록 열기
  const openFavorites = async () => {
    Keyboard.dismiss();
    closeDetails();
    setListMode('hidden');

    const requestId = ++favoritesRequestRef.current;

    setFavoritesVisible(true);
    setFavoritePlaces([]);
    setFavoritesLoading(true);

    try {
      const saved = await getFavorites();

      if (requestId !== favoritesRequestRef.current) {
        return;
      }

      setFavorites(saved);

      const loaded = [];

      for (
        let index = 0;
        index < saved.length;
        index += 3
      ) {
        const batch = saved.slice(index, index + 3);

        const results = await Promise.allSettled(
          batch.map((item) => getPlaceDetails(item.id))
        );

        if (requestId !== favoritesRequestRef.current) {
          return;
        }

        results.forEach((result, resultIndex) => {
          const favorite = batch[resultIndex];

          if (
            result.status === 'fulfilled' &&
            result.value
          ) {
            const detail = result.value;

            const distance = isValidCoordinate(detail)
              ? calculateDistance(
                  selectedLocation.latitude,
                  selectedLocation.longitude,
                  detail.latitude,
                  detail.longitude
                )
              : null;

            const loadedPlace = {
              ...detail,
              id: favorite.id,
              distance,
              savedAt: favorite.savedAt,
              loadError: false,
            };

            loaded.push(loadedPlace);

            if (isValidCoordinate(loadedPlace)) {
              favoriteCacheRef.current.set(
                favorite.id,
                loadedPlace
              );
            }
          } else {
            loaded.push({
              id: favorite.id,
              name: '장소 정보를 불러오지 못했습니다',
              address: '',
              savedAt: favorite.savedAt,
              loadError: true,
            });
          }
        });

        setFavoritePlaces([...loaded]);
      }

      if (requestId === favoritesRequestRef.current) {
        setFavoriteMarkers(
          saved
            .map((item) =>
              favoriteCacheRef.current.get(item.id)
            )
            .filter(isValidCoordinate)
        );
      }
    } catch (error) {
      if (requestId !== favoritesRequestRef.current) {
        return;
      }

      Alert.alert(
        '즐겨찾기 오류',
        error.message || '목록을 불러오지 못했습니다.'
      );
    } finally {
      if (requestId === favoritesRequestRef.current) {
        setFavoritesLoading(false);
      }
    }
  };

  const closeFavorites = () => {
    favoritesRequestRef.current += 1;
    setFavoritesVisible(false);
    setFavoritesLoading(false);
    setFavoritePlaces([]);
  };

  // 즐겨찾기 목록에서 삭제
  const handleRemoveFavorite = async (placeId) => {
    if (favoriteBusyRef.current) {
      return;
    }

    favoriteBusyRef.current = true;
    setFavoriteSaving(true);

    try {
      const updated = await removeFavorite(placeId);

      favoriteCacheRef.current.delete(placeId);

      setFavorites(updated);

      setFavoritePlaces((prev) =>
        prev.filter((item) => item.id !== placeId)
      );

      setFavoriteMarkers((prev) =>
        prev.filter((item) => item.id !== placeId)
      );
    } catch (error) {
      Alert.alert(
        '즐겨찾기 오류',
        error.message || '즐겨찾기를 해제하지 못했습니다.'
      );
    } finally {
      favoriteBusyRef.current = false;
      setFavoriteSaving(false);
    }
  };

  // 도보 길찾기
  const handleDirections = async (place) => {
    if (!isValidCoordinate(place)) {
      Alert.alert(
        '길찾기 오류',
        '목적지 좌표가 없습니다.'
      );
      return;
    }

    const origin =
      `${selectedLocation.latitude},${selectedLocation.longitude}`;

    const destination =
      `${place.latitude},${place.longitude}`;

    const url =
      'https://www.google.com/maps/dir/?api=1' +
      `&origin=${origin}` +
      `&destination=${destination}` +
      '&travelmode=walking';

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        '길찾기 오류',
        '지도 앱을 열 수 없습니다.'
      );
    }
  };

  // 웹사이트 열기
  const handleWebsite = async () => {
    const url = placeDetails?.website;

    if (!url || !/^https?:\/\//i.test(url)) {
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        '오류',
        '웹사이트를 열 수 없습니다.'
      );
    }
  };

  // Google Maps 전체 리뷰
  const handleOpenGoogleReviews = async () => {
    const place = {
      ...(selectedPlace || {}),
      ...(placeDetails || {}),
    };

    const url =
      place.googleMapsUri ||
      (selectedPlace?.id
        ? 'https://www.google.com/maps/search/?api=1' +
          `&query=${encodeURIComponent(
            place.name || '장소'
          )}` +
          `&query_place_id=${encodeURIComponent(
            selectedPlace.id
          )}`
        : null);

    if (!url) {
      Alert.alert(
        '리뷰 보기',
        'Google Maps 링크가 없습니다.'
      );
      return;
    }

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Google Maps 실행 오류:', error);

      Alert.alert(
        '오류',
        'Google Maps를 열 수 없습니다.'
      );
    }
  };

  // 전화 걸기
  const handleCall = async () => {
    const phone = displayedPlace.phone;

    if (!phone || !String(phone).trim()) {
      Alert.alert(
        '전화번호 없음',
        '이 가게는 전화번호 정보를 제공하지 않습니다.'
      );
      return;
    }

    const cleanPhone = String(phone).replace(
      /[^0-9+]/g,
      ''
    );

    if (!cleanPhone) {
      Alert.alert(
        '전화번호 오류',
        '유효한 전화번호가 없습니다.'
      );
      return;
    }

    try {
      const url = `tel:${cleanPhone}`;
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          '전화 연결 불가',
          '이 기기에서는 전화 기능을 사용할 수 없습니다.'
        );
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.error('전화 연결 오류:', error);

      Alert.alert(
        '전화 연결 실패',
        '전화 앱을 실행하지 못했습니다.'
      );
    }
  };

  // 장소 공유
  const handleShare = async () => {
    if (!selectedPlace?.id) {
      Alert.alert(
        '공유 오류',
        '공유할 장소가 없습니다.'
      );
      return;
    }

    const place = displayedPlace;
    const name = place.name || '선택한 장소';
    const address = place.address || '주소 정보 없음';

    const mapsUrl =
      'https://www.google.com/maps/search/?api=1' +
      `&query=${encodeURIComponent(name)}` +
      `&query_place_id=${encodeURIComponent(
        selectedPlace.id
      )}`;

    const message = [
      `📍 ${name}`,
      `주소: ${address}`,
      '',
      'Google Maps에서 위치 확인하기',
      mapsUrl,
    ].join('\n');

    try {
      await Share.share({
        title: `${name} 장소 공유`,
        message,
      });
    } catch (error) {
      console.error('장소 공유 오류:', error);

      Alert.alert(
        '공유 실패',
        '장소 정보를 공유하지 못했습니다.'
      );
    }
  };

  const listTitle = isTextSearch
    ? `"${keyword}" 검색 결과`
    : currentCategory
      ? `주변 ${currentCategory.label}`
      : '주변 장소';

  const sortLabel = SORT_OPTIONS.find(
    (option) => option.value === filters.sort
  )?.label;

  return (
    <View style={styles.container}>
      {/* 상단 */}
      <View
        style={[
          styles.header,
          { paddingTop: 8 },
        ]}
      >
        <Text style={styles.eyebrow}>
          생활정보
        </Text>

        <Text style={styles.title}>
          자취생존맵
        </Text>

        {/* 장소 검색 */}
        <View style={styles.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="장소 이름 검색"
            onPressFilter={openFilters}
            filterActive={filterActive}
          />
        </View>

        {/* 최근 검색 기록 */}
        <Pressable
          style={styles.historyToggle}
          onPress={() => {
            setHistoryVisible((prev) => !prev);
            Keyboard.dismiss();
          }}
        >
          <MaterialCommunityIcons
            name="history"
            size={18}
            color={c.accent}
          />

          <Text style={styles.historyToggleText}>
            최근 검색 기록 ({searchHistory.length})
          </Text>

          <MaterialCommunityIcons
            name={
              historyVisible
                ? 'chevron-up'
                : 'chevron-down'
            }
            size={18}
            color={c.textSecondary}
          />
        </Pressable>

        {historyVisible && (
          <View style={styles.historyPanel}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>
                최근 검색어
              </Text>

              {searchHistory.length > 0 && (
                <Pressable onPress={handleClearHistory}>
                  <Text style={styles.historyClear}>
                    전체 삭제
                  </Text>
                </Pressable>
              )}
            </View>

            {searchHistory.length === 0 ? (
              <Text style={styles.historyEmpty}>
                아직 검색 기록이 없습니다.
              </Text>
            ) : (
              <ScrollView
                style={styles.historyList}
                nestedScrollEnabled
                keyboardShouldPersistTaps="always"
              >
                {searchHistory.map((item) => (
                  <View
                    key={item.id}
                    style={styles.historyItem}
                  >
                    <Pressable
                      style={styles.historyItemMain}
                      onPress={() =>
                        handleHistoryPress(item)
                      }
                    >
                      <MaterialCommunityIcons
                        name={
                          item.type === 'address'
                            ? 'map-marker-outline'
                            : 'magnify'
                        }
                        size={17}
                        color={c.textSecondary}
                      />

                      <Text
                        style={styles.historyQuery}
                        numberOfLines={1}
                      >
                        {item.query}
                      </Text>

                      <Text style={styles.historyType}>
                        {item.type === 'address'
                          ? '주소'
                          : '장소'}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.historyRemove}
                      onPress={() =>
                        handleRemoveHistory(item.id)
                      }
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={18}
                        color={c.textSecondary}
                      />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* 주소 검색 */}
        <Pressable
          style={styles.addressSearchToggle}
          onPress={() => {
            if (addressVisible) {
              closeAddressSearch();
            } else {
              setAddressResults([]);
              setAddressVisible(true);
            }
          }}
        >
          <MaterialCommunityIcons
            name="map-search-outline"
            size={20}
            color={c.accent}
          />

          <Text style={styles.addressToggleText}>
            주소 또는 건물명으로 위치 이동
          </Text>

          <MaterialCommunityIcons
            name={
              addressVisible
                ? 'chevron-up'
                : 'chevron-down'
            }
            size={20}
            color={c.textSecondary}
          />
        </Pressable>

        {addressVisible && (
          <View style={styles.addressSearchPanel}>
            <View style={styles.addressInputRow}>
              <TextInput
                style={styles.addressInput}
                value={addressQuery}
                onChangeText={(value) => {
                  setAddressQuery(value);
                  setAddressResults([]);
                }}
                placeholder="예: 선문대학교, 서울특별시 강남구"
                placeholderTextColor="#899A96"
                returnKeyType="search"
                onSubmitEditing={() =>
                  handleAddressSearch()
                }
              />

              <Pressable
                style={styles.addressSearchButton}
                onPress={() => handleAddressSearch()}
                disabled={addressLoading}
              >
                {addressLoading ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="magnify"
                    size={22}
                    color="#FFFFFF"
                  />
                )}
              </Pressable>
            </View>

            {addressResults.length > 0 && (
              <ScrollView
                style={styles.addressResults}
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled
              >
                {addressResults.map((item, index) => (
                  <Pressable
                    key={
                      item.id || `address-${index}`
                    }
                    style={styles.addressResultItem}
                    onPress={() =>
                      handleSelectAddress(item)
                    }
                  >
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      size={20}
                      color={c.accent}
                    />

                    <View style={{ flex: 1 }}>
                      <Text
                        style={styles.addressResultName}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>

                      <Text
                        style={styles.addressResultSubtitle}
                        numberOfLines={2}
                      >
                        {item.address}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* 카테고리 */}
        <View style={styles.tabsWrap}>
          <CategoryTabs
            categories={CATEGORIES}
            selectedId={categoryId}
            onSelect={handleSelectCategory}
          />
        </View>

        <View style={styles.filterSummary}>
          <MaterialCommunityIcons
            name="map-marker-radius"
            size={15}
            color={c.accent}
          />

          <Text style={styles.filterSummaryText}>
            반경 {filters.radius / 1000}km
            {' · '}
            {filters.openNow
              ? '영업 중만'
              : '영업 상태 전체'}
            {' · '}
            {filters.minRating === 0
              ? '평점 전체'
              : `평점 ${filters.minRating} 이상`}
          </Text>
        </View>
      </View>

      {/* 지도 */}
      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          style={styles.map}
          mapType="standard"
          initialRegion={{
            ...INITIAL_LOCATION,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }}
          onPress={handleMapPress}
          onPoiClick={handlePoiClick}
        >
          <Marker
            coordinate={selectedLocation}
            title="선택한 기준 위치"
            pinColor="red"
            onPress={(event) =>
              event.stopPropagation()
            }
          />

          {places
            .filter(isValidCoordinate)
            .map((place) => (
              <Marker
                key={`search-${place.id}`}
                coordinate={{
                  latitude: place.latitude,
                  longitude: place.longitude,
                }}
                title={place.name}
                description={place.address}
                pinColor={
                  favorites.some(
                    (item) => item.id === place.id
                  )
                    ? 'gold'
                    : 'orange'
                }
                onPress={(event) => {
                  event.stopPropagation();
                  openPlaceDetails(place);
                }}
              />
            ))}

          {visibleFavoriteMarkers.map((place) => (
            <Marker
              key={`favorite-${place.id}`}
              coordinate={{
                latitude: place.latitude,
                longitude: place.longitude,
              }}
              title={`★ ${place.name || '즐겨찾기 장소'}`}
              description={place.address || ''}
              pinColor="gold"
              onPress={(event) => {
                event.stopPropagation();
                openPlaceDetails(place);
              }}
            />
          ))}
        </MapView>

        {/* 기준 위치 이동 */}
        <Pressable
          style={styles.locateButton}
          onPress={() => {
            mapRef.current?.animateToRegion(
              {
                ...selectedLocation,
                latitudeDelta: 0.03,
                longitudeDelta: 0.03,
              },
              600
            );
          }}
        >
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={24}
            color={c.text}
          />
        </Pressable>

        {/* 즐겨찾기 버튼 */}
        <Pressable
          style={styles.favoritesMapButton}
          onPress={openFavorites}
        >
          <MaterialCommunityIcons
            name="star"
            size={24}
            color="#F5B301"
          />

          {favorites.length > 0 && (
            <View style={styles.favoriteCountBadge}>
              <Text style={styles.favoriteCountText}>
                {favorites.length > 99
                  ? '99+'
                  : favorites.length}
              </Text>
            </View>
          )}
        </Pressable>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={c.accent} />
            <Text style={styles.loadingText}>
              장소 검색 중...
            </Text>
          </View>
        )}

        {/* 검색 결과 */}
        {!loading &&
          places.length > 0 &&
          listMode === 'expanded' &&
          !showDetails &&
          !favoritesVisible && (
            <View
              style={[
                styles.resultPanel,
                { bottom: bottomOffset },
              ]}
            >
              <Pressable
                style={styles.resultHeader}
                onPress={() =>
                  setListMode('collapsed')
                }
              >
                <View style={styles.resultTitleGroup}>
                  <Text style={styles.resultTitle}>
                    {listTitle}
                  </Text>

                  <Text style={styles.resultCount}>
                    {places.length}개
                  </Text>
                </View>

                <Text style={styles.sortLabel}>
                  {sortLabel}
                </Text>

                <MaterialCommunityIcons
                  name="chevron-down"
                  size={24}
                  color={c.textSecondary}
                />
              </Pressable>

              <FlatList
                data={places}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <PlaceResultCard
                    place={item}
                    onPress={openPlaceDetails}
                    onDirections={handleDirections}
                  />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              />
            </View>
          )}

        {!loading &&
          places.length > 0 &&
          listMode === 'collapsed' &&
          !showDetails &&
          !favoritesVisible && (
            <Pressable
              style={[
                styles.collapsedPanel,
                { bottom: bottomOffset },
              ]}
              onPress={() =>
                setListMode('expanded')
              }
            >
              <MaterialCommunityIcons
                name="format-list-bulleted"
                size={22}
                color={c.accent}
              />

              <Text style={styles.collapsedText}>
                검색 결과 {places.length}개
              </Text>

              <MaterialCommunityIcons
                name="chevron-up"
                size={24}
                color={c.textSecondary}
              />
            </Pressable>
          )}

        {!loading &&
          places.length > 0 &&
          listMode === 'hidden' &&
          !showDetails &&
          !favoritesVisible && (
            <Pressable
              style={[
                styles.restoreButton,
                { bottom: bottomOffset },
              ]}
              onPress={() =>
                setListMode('expanded')
              }
            >
              <MaterialCommunityIcons
                name="format-list-bulleted"
                size={18}
                color={colors.white}
              />

              <Text style={styles.restoreText}>
                목록 보기 ({places.length})
              </Text>
            </Pressable>
          )}

        {/* 즐겨찾기 목록 */}
        {favoritesVisible && (
          <View
            style={[
              styles.favoritesPanel,
              { bottom: bottomOffset },
            ]}
          >
            <View style={styles.favoritesHeader}>
              <MaterialCommunityIcons
                name="star"
                size={23}
                color="#F5B301"
              />

              <Text style={styles.favoritesTitle}>
                내 즐겨찾기
              </Text>

              <Text style={styles.favoritesCount}>
                {favorites.length}개
              </Text>

              <Pressable
                style={styles.closeButton}
                onPress={closeFavorites}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={25}
                  color={c.textSecondary}
                />
              </Pressable>
            </View>

            {favorites.length === 0 &&
            !favoritesLoading ? (
              <View style={styles.emptyFavorites}>
                <MaterialCommunityIcons
                  name="star-outline"
                  size={36}
                  color="#9AAEAA"
                />

                <Text style={styles.emptyFavoritesText}>
                  아직 저장한 가게가 없습니다.
                </Text>

                <Text style={styles.emptyFavoritesSubtext}>
                  가게 상세정보에서 별을 눌러 저장해 보세요.
                </Text>
              </View>
            ) : (
              <>
                {favoritesLoading && (
                  <View style={styles.favoritesLoadingRow}>
                    <ActivityIndicator
                      size="small"
                      color={c.accent}
                    />

                    <Text style={styles.loadingText}>
                      최신 장소 정보 불러오는 중...
                    </Text>
                  </View>
                )}

                <FlatList
                  data={favoritePlaces}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={
                    styles.favoriteListContent
                  }
                  showsVerticalScrollIndicator
                  renderItem={({ item }) => (
                    <View style={styles.favoriteItem}>
                      <Pressable
                        style={styles.favoriteItemBody}
                        onPress={() =>
                          handleSelectFavoritePlace(item)
                        }
                      >
                        <Text
                          style={styles.favoriteItemName}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>

                        {item.loadError ? (
                          <Text style={styles.favoriteError}>
                            선택하면 정보 조회를 다시 시도합니다.
                          </Text>
                        ) : (
                          <>
                            <Text
                              style={styles.favoriteItemAddress}
                              numberOfLines={1}
                            >
                              {item.address ||
                                '주소 정보 없음'}
                            </Text>

                            <View style={styles.favoriteMetaRow}>
                              <Text style={styles.favoriteMeta}>
                                {item.openNow === true
                                  ? '영업 중'
                                  : item.openNow === false
                                    ? '영업 종료'
                                    : '영업정보 없음'}
                              </Text>

                              <Text style={styles.favoriteMeta}>
                                ⭐{' '}
                                {item.rating != null
                                  ? Number(item.rating).toFixed(1)
                                  : '-'}
                              </Text>

                              <Text style={styles.favoriteMeta}>
                                {formatDistance(item.distance)}
                              </Text>
                            </View>
                          </>
                        )}
                      </Pressable>

                      <Pressable
                        style={styles.favoriteRemoveButton}
                        disabled={favoriteSaving}
                        onPress={() =>
                          handleRemoveFavorite(item.id)
                        }
                      >
                        <MaterialCommunityIcons
                          name="star"
                          size={26}
                          color="#F5B301"
                        />
                      </Pressable>
                    </View>
                  )}
                />
              </>
            )}
          </View>
        )}

        {/* 드래그 가능한 상세정보 바텀시트 */}
        {showDetails && selectedPlace && (
          <View
            style={[
              styles.detailOverlay,
              {
                bottom: bottomOffset,
                height: sheetExpanded ? '99%' : '60%',
                maxHeight: undefined,
              },
            ]}
          >
            {/* 드래그 손잡이 */}
            <View
              style={styles.sheetDragArea}
              {...sheetPanResponder.panHandlers}
            >
              <View style={styles.sheetDragHandle} />
            </View>

            {/* 상세정보 제목 */}
            <View style={styles.detailHeader}>
              <Text
                style={styles.detailTitle}
                numberOfLines={2}
              >
                {displayedPlace.name}
              </Text>

              <Pressable
                style={styles.favoriteButton}
                onPress={handleToggleFavorite}
                disabled={favoriteSaving}
              >
                <MaterialCommunityIcons
                  name={
                    selectedIsFavorite
                      ? 'star'
                      : 'star-outline'
                  }
                  size={28}
                  color={
                    selectedIsFavorite
                      ? '#F5B301'
                      : c.textSecondary
                  }
                />
              </Pressable>

              <Pressable
                style={styles.closeButton}
                onPress={handleCloseDetails}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={25}
                  color={c.textSecondary}
                />
              </Pressable>
            </View>

            {detailsLoading ? (
              <View style={styles.loadingDetails}>
                <ActivityIndicator
                  size="large"
                  color={c.accent}
                />

                <Text style={styles.loadingText}>
                  상세정보 불러오는 중...
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.detailScroll}
                contentContainerStyle={styles.detailContent}
                nestedScrollEnabled
                showsVerticalScrollIndicator
              >
                {detailsError && (
                  <Text style={styles.errorText}>
                    상세정보 오류: {detailsError}
                  </Text>
                )}

                <Text style={styles.detailText}>
                  📍 {displayedPlace.address || '주소 정보 없음'}
                </Text>

                <Text style={styles.detailText}>
                  📏 직선거리:{' '}
                  {formatDistance(
                    isValidCoordinate(displayedPlace)
                      ? calculateDistance(
                          selectedLocation.latitude,
                          selectedLocation.longitude,
                          displayedPlace.latitude,
                          displayedPlace.longitude
                        )
                      : selectedPlace.distance
                  )}
                </Text>

                <Text style={styles.detailText}>
                  ⭐ 평점:{' '}
                  {displayedPlace.rating != null
                    ? Number(displayedPlace.rating).toFixed(1)
                    : '정보 없음'}
                </Text>

                <Text style={styles.detailText}>
                  💬 리뷰:{' '}
                  {displayedPlace.reviewCount != null
                    ? `${displayedPlace.reviewCount}개`
                    : '정보 없음'}
                </Text>

                <Text style={styles.detailText}>
                  🕒 영업 상태:{' '}
                  {displayedPlace.openNow === true
                    ? '영업 중'
                    : displayedPlace.openNow === false
                      ? '영업 종료'
                      : '정보 없음'}
                </Text>

                {displayedPlace.openingHours?.length > 0 && (
                  <View style={styles.hoursBox}>
                    <Text style={styles.hoursTitle}>
                      영업시간
                    </Text>

                    {displayedPlace.openingHours.map(
                      (hours, index) => (
                        <Text
                          key={index}
                          style={styles.detailText}
                        >
                          {hours}
                        </Text>
                      )
                    )}
                  </View>
                )}

                <Text style={styles.detailText}>
                  📞 {displayedPlace.phone || '전화번호 정보 없음'}
                </Text>

                {displayedPlace.parking && (
                  <Text style={styles.detailText}>
                    🚗 주차 관련 정보 제공
                  </Text>
                )}

                {/* 사용자 리뷰 */}
                <View style={styles.reviewsSection}>
                  <View style={styles.reviewsHeader}>
                    <Text style={styles.reviewsTitle}>
                      사용자 리뷰
                    </Text>

                    <Text style={styles.reviewsSubtitle}>
                      Google Maps에서 제공하는 리뷰 최대 5개
                    </Text>
                  </View>

                  {Array.isArray(placeDetails?.reviews) &&
                  placeDetails.reviews.length > 0 ? (
                    placeDetails.reviews.map(
                      (review, index) => (
                        <View
                          key={
                            review.id || `review-${index}`
                          }
                          style={styles.reviewCard}
                        >
                          <View style={styles.reviewTopRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.reviewAuthor}>
                                {review.author ||
                                  'Google 사용자'}
                              </Text>

                              <Text style={styles.reviewDate}>
                                {review.relativePublishTime ||
                                  ''}
                              </Text>
                            </View>

                            <Text style={styles.reviewRating}>
                              ⭐{' '}
                              {review.rating != null
                                ? Number(
                                    review.rating
                                  ).toFixed(1)
                                : '-'}
                            </Text>
                          </View>

                          {review.text ? (
                            <Text style={styles.reviewText}>
                              {review.text}
                            </Text>
                          ) : (
                            <Text
                              style={styles.reviewEmptyText}
                            >
                              별점만 남긴 리뷰입니다.
                            </Text>
                          )}
                        </View>
                      )
                    )
                  ) : (
                    <Text style={styles.reviewEmptyText}>
                      표시할 수 있는 리뷰가 없습니다.
                    </Text>
                  )}

                  <Pressable
                    style={styles.googleReviewsButton}
                    onPress={handleOpenGoogleReviews}
                  >
                    <MaterialCommunityIcons
                      name="google-maps"
                      size={20}
                      color={c.accent}
                    />

                    <Text
                      style={styles.googleReviewsButtonText}
                    >
                      Google Maps에서 전체 리뷰 보기
                    </Text>

                    <MaterialCommunityIcons
                      name="open-in-new"
                      size={16}
                      color={c.accent}
                    />
                  </Pressable>

                  <Text style={styles.reviewsAttribution}>
                    리뷰 제공: Google Maps
                  </Text>
                </View>
              </ScrollView>
            )}

            {/* 상세정보 하단 버튼 */}
            <View style={styles.actionRow}>
              <Pressable
                style={[
                  styles.detailActionButton,
                  !displayedPlace.phone &&
                    styles.disabledActionButton,
                ]}
                onPress={handleCall}
              >
                <MaterialCommunityIcons
                  name="phone-outline"
                  size={21}
                  color={
                    displayedPlace.phone
                      ? c.accent
                      : c.textSecondary
                  }
                />

                <Text style={styles.detailActionText}>
                  전화
                </Text>
              </Pressable>

              <Pressable
                style={styles.detailActionButton}
                onPress={handleShare}
              >
                <MaterialCommunityIcons
                  name="share-variant-outline"
                  size={21}
                  color={c.accent}
                />

                <Text style={styles.detailActionText}>
                  공유
                </Text>
              </Pressable>

              <Pressable
                style={styles.detailActionButton}
                onPress={() =>
                  handleDirections(displayedPlace)
                }
              >
                <MaterialCommunityIcons
                  name="navigation-outline"
                  size={21}
                  color={c.accent}
                />

                <Text style={styles.detailActionText}>
                  길찾기
                </Text>
              </Pressable>

              {placeDetails?.website && (
                <Pressable
                  style={styles.detailActionButton}
                  onPress={handleWebsite}
                >
                  <MaterialCommunityIcons
                    name="web"
                    size={21}
                    color={c.accent}
                  />

                  <Text style={styles.detailActionText}>
                    웹사이트
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>

      {/* 필터 모달 */}
      <Modal
        visible={filterVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setFilterVisible(false)
        }
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalOutside}
            onPress={() =>
              setFilterVisible(false)
            }
          />

          <View
            style={[
              styles.modalContent,
              {
                paddingBottom:
                  Math.max(insets.bottom, 16) + 16,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                검색 필터
              </Text>

              <Pressable
                onPress={() =>
                  setFilterVisible(false)
                }
              >
                <MaterialCommunityIcons
                  name="close"
                  size={25}
                  color={c.text}
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.modalScroll}
            >
              <Text style={styles.filterLabel}>
                검색 반경
              </Text>

              <View style={styles.optionsRow}>
                {RADIUS_OPTIONS.map((option) => (
                  <FilterOption
                    key={option.value}
                    label={option.label}
                    selected={
                      draftFilters.radius === option.value
                    }
                    onPress={() =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        radius: option.value,
                      }))
                    }
                  />
                ))}
              </View>

              <Text style={styles.filterLabel}>
                영업 상태
              </Text>

              <View style={styles.optionsRow}>
                <FilterOption
                  label="전체"
                  selected={!draftFilters.openNow}
                  onPress={() =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      openNow: false,
                    }))
                  }
                />

                <FilterOption
                  label="영업 중만"
                  selected={draftFilters.openNow}
                  onPress={() =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      openNow: true,
                    }))
                  }
                />
              </View>

              <Text style={styles.filterLabel}>
                최소 평점
              </Text>

              <View style={styles.optionsRow}>
                {RATING_OPTIONS.map((option) => (
                  <FilterOption
                    key={option.value}
                    label={option.label}
                    selected={
                      draftFilters.minRating === option.value
                    }
                    onPress={() =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        minRating: option.value,
                      }))
                    }
                  />
                ))}
              </View>

              <Text style={styles.filterLabel}>
                정렬 기준
              </Text>

              <View style={styles.sortOptions}>
                {SORT_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={styles.sortOption}
                    onPress={() =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        sort: option.value,
                      }))
                    }
                  >
                    <MaterialCommunityIcons
                      name={
                        draftFilters.sort === option.value
                          ? 'radiobox-marked'
                          : 'radiobox-blank'
                      }
                      size={21}
                      color={
                        draftFilters.sort === option.value
                          ? c.accent
                          : c.textSecondary
                      }
                    />

                    <Text style={styles.sortOptionText}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.resetButton}
                onPress={() =>
                  setDraftFilters({
                    ...DEFAULT_PLACE_FILTERS,
                  })
                }
              >
                <MaterialCommunityIcons
                  name="refresh"
                  size={18}
                  color={c.text}
                />

                <Text style={styles.resetText}>
                  초기화
                </Text>
              </Pressable>

              <Pressable
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyText}>
                  필터 적용
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    paddingHorizontal: 12,
    paddingBottom: 6,
    backgroundColor: colors.white,
  },

  eyebrow: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: c.textSecondary,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: c.text,
    marginTop: 0,
  },

  searchWrap: {
    marginTop: 7,
  },

  // 검색 기록
  historyToggle: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 7,
    borderRadius: 9,
    backgroundColor: '#F4F7F6',
  },

  historyToggleText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: c.text,
  },

  historyPanel: {
    marginTop: 6,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F4F7F6',
  },

  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 5,
  },

  historyTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: c.text,
  },

  historyClear: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: c.accent,
  },

  historyEmpty: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: c.textSecondary,
    paddingVertical: 9,
  },

  historyList: {
    maxHeight: 170,
  },

  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E8E5',
  },

  historyItemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 10,
  },

  historyQuery: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: c.text,
  },

  historyType: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: c.textSecondary,
  },

  historyRemove: {
    padding: 8,
  },

  // 주소 검색
  addressSearchToggle: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F4F7F6',
    gap: 8,
  },

  addressToggleText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: c.text,
  },

  addressSearchPanel: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5EBEA',
    padding: 8,
    backgroundColor: colors.white,
  },

  addressInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  addressInput: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F4F7F6',
    color: c.text,
    fontSize: 13,
    fontFamily: fonts.regular,
  },

  addressSearchButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.accent,
    borderRadius: 8,
  },

  addressResults: {
    maxHeight: 190,
    marginTop: 6,
  },

  addressResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E5EBEA',
  },

  addressResultName: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: c.text,
  },

  addressResultSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: c.textSecondary,
    marginTop: 3,
  },

  tabsWrap: {
    marginTop: 5,
  },

  filterSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 5,
  },

  filterSummaryText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: c.textSecondary,
  },

  // 지도
  mapArea: {
    flex: 1,
    minHeight: 300,
    position: 'relative',
  },

  map: {
    width: '100%',
    height: '100%',
  },

  locateButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 48,
    height: 48,
    backgroundColor: colors.white,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },

  favoritesMapButton: {
    position: 'absolute',
    top: 74,
    right: 16,
    width: 48,
    height: 48,
    backgroundColor: colors.white,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },

  favoriteCountBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 3,
    backgroundColor: c.accent,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  favoriteCountText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.white,
  },

  loadingBox: {
    position: 'absolute',
    top: 135,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 4,
    gap: 8,
  },

  loadingText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: c.text,
  },

  // 검색 결과
  resultPanel: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: '48%',
    minHeight: 180,
    maxHeight: 420,
    backgroundColor: colors.white,
    borderRadius: 18,
    elevation: 7,
    overflow: 'hidden',
  },

  resultHeader: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#E5EBEA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },

  resultTitleGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  resultTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: c.text,
    flexShrink: 1,
  },

  resultCount: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: c.accent,
  },

  sortLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: c.textSecondary,
  },

  listContent: {
    padding: 10,
    paddingBottom: 18,
  },

  collapsedPanel: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 15,
    paddingHorizontal: 16,
    elevation: 6,
    gap: 10,
  },

  collapsedText: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 14,
    color: c.text,
  },

  restoreButton: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.accent,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    elevation: 6,
    gap: 7,
  },

  restoreText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
  },

  // 즐겨찾기
  favoritesPanel: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: '60%',
    minHeight: 230,
    maxHeight: 480,
    backgroundColor: colors.white,
    borderRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },

  favoritesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#E5EBEA',
    gap: 8,
  },

  favoritesTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 17,
    color: c.text,
  },

  favoritesCount: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: c.accent,
  },

  favoritesLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },

  favoriteListContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5EBEA',
    gap: 10,
  },

  favoriteItemBody: {
    flex: 1,
    gap: 5,
  },

  favoriteItemName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: c.text,
  },

  favoriteItemAddress: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: c.textSecondary,
  },

  favoriteMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  favoriteMeta: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: c.textSecondary,
  },

  favoriteRemoveButton: {
    padding: 8,
  },

  favoriteError: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#C34242',
  },

  emptyFavorites: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },

  emptyFavoritesText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: c.text,
  },

  emptyFavoritesSubtext: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: c.textSecondary,
    textAlign: 'center',
  },

  // 상세정보 바텀시트
  detailOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingBottom: 18,
    elevation: 12,
    overflow: 'hidden',
  },

  // 드래그 손잡이
  sheetDragArea: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sheetDragHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#B7C3C0',
  },

  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5EBEA',
  },

  detailTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 19,
    color: c.text,
    marginRight: 12,
  },

  favoriteButton: {
    padding: 6,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeButton: {
    padding: 4,
  },

  loadingDetails: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  detailScroll: {
    flex: 1,
    minHeight: 0,
    marginTop: 12,
  },

  detailContent: {
    paddingBottom: 16,
  },

  detailText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 21,
    color: c.text,
    marginBottom: 8,
  },

  errorText: {
    fontFamily: fonts.regular,
    color: '#C34242',
    marginBottom: 8,
  },

  hoursBox: {
    backgroundColor: '#F4F7F6',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },

  hoursTitle: {
    fontFamily: fonts.bold,
    marginBottom: 6,
    color: c.text,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5EBEA',
  },

  detailActionButton: {
    flex: 1,
    minHeight: 65,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F7F6',
    borderRadius: 12,
    gap: 5,
  },

  detailActionText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: c.text,
  },

  disabledActionButton: {
    opacity: 0.45,
  },

  // 리뷰
  reviewsSection: {
    marginTop: 14,
    marginBottom: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5EBEA',
  },

  reviewsHeader: {
    marginBottom: 12,
  },

  reviewsTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: c.text,
  },

  reviewsSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: c.textSecondary,
    marginTop: 4,
  },

  reviewCard: {
    backgroundColor: '#F4F7F6',
    borderRadius: 12,
    padding: 13,
    marginBottom: 10,
  },

  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  reviewAuthor: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: c.text,
  },

  reviewDate: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: c.textSecondary,
    marginTop: 3,
  },

  reviewRating: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#D69E00',
  },

  reviewText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 20,
    color: c.text,
  },

  reviewEmptyText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: c.textSecondary,
    marginBottom: 10,
  },

  googleReviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#E3F3F0',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 10,
    marginTop: 4,
  },

  googleReviewsButtonText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: c.accent,
    flexShrink: 1,
  },

  reviewsAttribution: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: c.textSecondary,
    textAlign: 'right',
    marginTop: 8,
  },

  // 필터 모달
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  modalOutside: {
    flex: 1,
  },

  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    maxHeight: '85%',
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: c.text,
  },

  modalScroll: {
    flexGrow: 0,
  },

  filterLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: c.text,
    marginBottom: 10,
    marginTop: 8,
  },

  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },

  optionButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F4F7F6',
    borderWidth: 1,
    borderColor: '#E2EAE8',
  },

  optionButtonSelected: {
    backgroundColor: '#E3F3F0',
    borderColor: c.accent,
  },

  optionText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: c.textSecondary,
  },

  optionTextSelected: {
    fontFamily: fonts.bold,
    color: c.accent,
  },

  sortOptions: {
    gap: 14,
    marginBottom: 22,
  },

  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 3,
  },

  sortOptionText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: c.text,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5EBEA',
  },

  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#D9E2E0',
    borderRadius: 12,
    paddingVertical: 14,
  },

  resetText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: c.text,
  },

  applyButton: {
    flex: 2,
    backgroundColor: c.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  applyText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
  },
});
