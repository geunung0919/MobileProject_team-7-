import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { searchNearbyPlaces, getPlaceDetails } from '../api/placeApi';

// Android: 기본 Google Maps / iOS Expo Go: 기본 Apple Maps.
// 두 환경에서 공통으로 동작하도록 '검색 API의 장소 마커'를 직접 표시합니다.
const CATEGORIES = [
  { id: 'restaurant', name: '음식점', icon: '🍚' },
  { id: 'cafe', name: '카페', icon: '☕' },
  { id: 'convenience', name: '편의점', icon: '🏪' },
  { id: 'mart', name: '마트', icon: '🛒' },
  { id: 'hospital', name: '병원', icon: '🏥' },
  { id: 'laundry', name: '세탁소', icon: '🧺' },
];

const INITIAL_LOCATION = { latitude: 36.8002, longitude: 127.0749 };
const SEARCH_TIMEOUT_MS = 20000;
const DETAILS_TIMEOUT_MS = 15000;
const SNAP_POINTS = { collapsed: 0.15, normal: 0.35, expanded: 0.70 };
const SNAP_NAMES = Object.keys(SNAP_POINTS);
const clamp = (value, lower, upper) => Math.min(upper, Math.max(lower, value));

const formatDistance = (distance) => {
  if (distance === null || distance === undefined || distance === '') return '정보 없음';
  const value = Number(distance);
  if (!Number.isFinite(value)) return '정보 없음';
  return value >= 1000 ? `${(value / 1000).toFixed(1)}km` : `${Math.round(value)}m`;
};

const withTimeout = async (promise, limit) => {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('서버 응답 시간이 초과되었습니다.')), limit);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

const readableError = (error, fallback) => {
  const message = error?.message || fallback;
  if (/timed out|timeout|시간이 초과/i.test(message)) {
    return '서버 응답 시간이 초과되었습니다. PC의 3001번 서버와 Wi-Fi를 확인한 뒤 다시 검색해 주세요.';
  }
  return message;
};

const isValidPlace = (place) =>
  place &&
  Number.isFinite(Number(place.latitude)) &&
  Number.isFinite(Number(place.longitude));

export default function MapScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const mapRef = useRef(null);
  const searchRequestRef = useRef(0);
  const detailRequestRef = useRef(0);
  const mountedRef = useRef(true);

  const [selectedLocation, setSelectedLocation] = useState(INITIAL_LOCATION);
  // 처음 화면에서도 음식점 결과 마커가 나타나게 기본 검색을 실행합니다.
  const [selectedCategory, setSelectedCategory] = useState('restaurant');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  // 바텀시트: 회색 손잡이로만 드래그하여 목록 스크롤과 충돌하지 않게 합니다.
  const [sheetMode, setSheetMode] = useState('normal');
  const [dragHeight, setDragHeight] = useState(null);
  const sheetModeRef = useRef('normal');
  const sheetHeightRef = useRef(windowHeight);
  const dragStartRef = useRef(0);
  const pointerHeightRef = useRef(0);
  const bottomInset = Platform.OS === 'ios' ? 12 : 8;
  const sheetHeight = dragHeight ?? Math.round(windowHeight * SNAP_POINTS[sheetMode]);
  sheetHeightRef.current = windowHeight;
  sheetModeRef.current = sheetMode;

  const switchSheet = (next) => {
    setDragHeight(null);
    setSheetMode(next);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        dragStartRef.current = sheetHeightRef.current * SNAP_POINTS[sheetModeRef.current];
        pointerHeightRef.current = dragStartRef.current;
      },
      onPanResponderMove: (_, g) => {
        const h = sheetHeightRef.current;
        const next = clamp(
          dragStartRef.current - g.dy,
          h * SNAP_POINTS.collapsed,
          h * SNAP_POINTS.expanded
        );
        pointerHeightRef.current = next;
        setDragHeight(next);
      },
      onPanResponderRelease: (_, g) => {
        const h = sheetHeightRef.current;
        const projected = clamp(
          dragStartRef.current - g.dy - g.vy * 70,
          h * SNAP_POINTS.collapsed,
          h * SNAP_POINTS.expanded
        );
        const nearest = SNAP_NAMES.reduce((best, next) =>
          Math.abs(h * SNAP_POINTS[next] - projected) < Math.abs(h * SNAP_POINTS[best] - projected)
            ? next
            : best
        );
        sheetModeRef.current = nearest;
        setSheetMode(nearest);
        setDragHeight(null);
      },
      onPanResponderTerminate: () => setDragHeight(null),
      onPanResponderTerminationRequest: () => true,
    })
  ).current;

  const invalidateDetails = () => {
    detailRequestRef.current += 1;
    setSelectedPlace(null);
    setPlaceDetails(null);
    setDetailsLoading(false);
    setDetailsError('');
  };

  const invalidateSearch = () => {
    searchRequestRef.current += 1;
    setPlaces([]);
    setLoading(false);
    setSearchError('');
    invalidateDetails();
  };

  const searchPlaces = async (category, location = selectedLocation) => {
    if (!category) return;
    const requestId = ++searchRequestRef.current;
    setSelectedCategory(category);
    setPlaces([]);
    setSearchError('');
    setLoading(true);
    invalidateDetails();
    switchSheet('normal');

    console.log('[지도] 장소 검색 시작', category, location);
    try {
      const response = await withTimeout(
        searchNearbyPlaces(location.latitude, location.longitude, category),
        SEARCH_TIMEOUT_MS
      );
      if (!mountedRef.current || requestId !== searchRequestRef.current) return;
      if (!Array.isArray(response)) throw new Error('장소 검색 응답 형식이 올바르지 않습니다.');
      const results = response.filter(isValidPlace);
      setPlaces(results);
      if (results.length === 0) {
        setSearchError('검색 결과가 없습니다. 위치나 카테고리를 변경해 보세요.');
      }
      console.log('[지도] 장소 검색 완료', results.length);
    } catch (error) {
      if (!mountedRef.current || requestId !== searchRequestRef.current) return;
      const message = readableError(error, '장소 검색에 실패했습니다.');
      setSearchError(message);
      console.error('[지도] 장소 검색 오류:', message);
    } finally {
      if (mountedRef.current && requestId === searchRequestRef.current) setLoading(false);
    }
  };

  // 처음 앱을 열면 주변 음식점을 검색합니다.
  useEffect(() => {
    mountedRef.current = true;
    searchPlaces('restaurant', INITIAL_LOCATION);
    return () => {
      mountedRef.current = false;
      searchRequestRef.current += 1;
      detailRequestRef.current += 1;
    };
    // 최초 렌더링 시 한 번만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCategoryPress = (category) => searchPlaces(category.id);

  const handleResetCategory = () => {
    setSelectedCategory(null);
    invalidateSearch();
    switchSheet('normal');
  };

  // 기본 지도 POI를 누르는 것과 실제 API 결과 마커를 누르는 것은 다릅니다.
  // Apple Maps POI의 상세정보 클릭은 Expo Go의 공통 API로 제공되지 않습니다.
  // 따라서 지도 짧은 터치는 아무 행동도 하지 않고, 길게 누르면 기준 위치를 변경합니다.
  const handleMapLongPress = (event) => {
    const coordinate = event.nativeEvent?.coordinate;
    if (!isValidPlace(coordinate)) return;
    const next = { latitude: coordinate.latitude, longitude: coordinate.longitude };
    setSelectedLocation(next);
    if (selectedCategory) {
      searchPlaces(selectedCategory, next);
    } else {
      invalidateSearch();
    }
  };

  const moveToLocation = (place) => {
    if (!isValidPlace(place)) return;
    mapRef.current?.animateToRegion(
      {
        latitude: Number(place.latitude),
        longitude: Number(place.longitude),
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      450
    );
  };

  const handlePlacePress = async (place) => {
    if (!place) return;
    const requestId = ++detailRequestRef.current;
    setSelectedPlace(place);
    setPlaceDetails(null);
    setDetailsError('');
    setDetailsLoading(true);
    switchSheet('normal');
    moveToLocation(place);

    try {
      if (!place.id) throw new Error('장소 ID가 없어 상세정보를 조회할 수 없습니다.');
      const response = await withTimeout(getPlaceDetails(place.id), DETAILS_TIMEOUT_MS);
      if (!mountedRef.current || requestId !== detailRequestRef.current) return;
      if (!response) throw new Error('상세정보를 받지 못했습니다.');
      setPlaceDetails(response);
    } catch (error) {
      if (!mountedRef.current || requestId !== detailRequestRef.current) return;
      const message = readableError(error, '상세정보 조회에 실패했습니다.');
      setDetailsError(message);
      console.error('[지도] 상세정보 오류:', message);
    } finally {
      if (mountedRef.current && requestId === detailRequestRef.current) setDetailsLoading(false);
    }
  };

  const openWebsite = async (url) => {
    if (!url) return;
    try {
      if (!/^https?:\/\//i.test(url)) throw new Error('잘못된 URL');
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('오류', '웹사이트를 열 수 없습니다.');
    }
  };

  const openPhone = async (number) => {
    if (!number) return;
    try {
      await Linking.openURL(`tel:${String(number).replace(/[^\d+]/g, '')}`);
    } catch (error) {
      Alert.alert('오류', '전화 앱을 열 수 없습니다.');
    }
  };

  const openDirections = async (place) => {
    if (!isValidPlace(place)) return;
    const lat = Number(place.latitude);
    const lng = Number(place.longitude);
    // 둘 다 설치된 기본 지도 앱의 웹 길찾기를 이용할 수 있습니다.
    const url = Platform.OS === 'ios'
      ? `https://maps.apple.com/?daddr=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    await openWebsite(url);
  };

  const currentCategory = CATEGORIES.find((item) => item.id === selectedCategory);
  const displayedPlace = placeDetails || selectedPlace;
  const rating = placeDetails?.rating != null ? Number(placeDetails.rating) : null;
  const hasRating = rating != null && Number.isFinite(rating);
  const canShowFull = sheetMode !== 'collapsed' || dragHeight != null && dragHeight > windowHeight * 0.23;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType="standard"
        initialRegion={{ ...INITIAL_LOCATION, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
        onLongPress={handleMapLongPress}
      >
        <Marker
          coordinate={selectedLocation}
          title="검색 기준 위치"
          description="지도를 길게 눌러 위치를 변경하세요"
          pinColor="red"
        />
        {places.map((place, index) => (
          <Marker
            key={`${place.id || 'place'}-${index}`}
            coordinate={{
              latitude: Number(place.latitude),
              longitude: Number(place.longitude),
            }}
            title={place.name || '장소'}
            description={place.address || ''}
            pinColor="orange"
            onPress={() => handlePlacePress(place)}
          />
        ))}
      </MapView>

      {/* 카테고리 영역 */}
      <View style={styles.topContainer} pointerEvents="box-none">
        <View style={styles.header}>
          <Text style={styles.title}>자취생존맵</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          <Pressable
            style={[styles.categoryButton, !selectedCategory && styles.selectedButton]}
            onPress={handleResetCategory}
          >
            <Text style={[styles.categoryText, !selectedCategory && styles.selectedText]}>전체</Text>
          </Pressable>
          {CATEGORIES.map((category) => {
            const selected = selectedCategory === category.id;
            return (
              <Pressable
                key={category.id}
                onPress={() => handleCategoryPress(category)}
                style={[styles.categoryButton, selected && styles.selectedButton]}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[styles.categoryText, selected && styles.selectedText]}>{category.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 검색 로딩은 시트 위쪽에 표시 */}
      {loading && (
        <View style={styles.loadingBox} pointerEvents="none">
          <ActivityIndicator size="small" color="#087F79" />
          <Text style={styles.loadingText}>주변 장소 검색 중...</Text>
        </View>
      )}

      {/* 드래그형 하단 카드 */}
      <View style={[styles.sheet, { height: sheetHeight, paddingBottom: bottomInset }]}>
        <View style={styles.handleTouchArea} {...panResponder.panHandlers}>
          <View style={styles.handleBar} />
          <Text style={styles.handleHint}>위아래로 드래그</Text>
        </View>

        {selectedPlace ? (
          <>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {displayedPlace?.name || '장소 정보'}
                </Text>
                <Text style={styles.subTitle} numberOfLines={1}>
                  {formatDistance(selectedPlace.distance)} · {hasRating ? `⭐ ${rating.toFixed(1)}` : '평점 정보 없음'}
                </Text>
              </View>
              <Pressable onPress={invalidateDetails} style={styles.closeButton} accessibilityLabel="상세정보 닫기">
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>
            {canShowFull && (
              <ScrollView
                style={styles.sheetScroll}
                contentContainerStyle={styles.sheetScrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {detailsLoading && (
                  <View style={styles.inlineLoading}>
                    <ActivityIndicator size="small" color="#087F79" />
                    <Text style={styles.loadingText}>상세정보 불러오는 중...</Text>
                  </View>
                )}
                {!!detailsError && <Text style={styles.errorText}>{detailsError}</Text>}
                <Text style={styles.detailText}>📍 {displayedPlace?.address || '주소 정보 없음'}</Text>
                <Text style={styles.detailText}>📏 직선거리: {formatDistance(selectedPlace.distance)}</Text>
                <Text style={styles.detailText}>⭐ 평점: {hasRating ? rating.toFixed(1) : '정보 없음'}</Text>
                <Text style={styles.detailText}>
                  💬 리뷰: {placeDetails?.reviewCount != null ? `${placeDetails.reviewCount}개` : '정보 없음'}
                </Text>
                <Text style={styles.detailText}>
                  🕒 영업 상태: {placeDetails?.openNow === true ? '영업 중' : placeDetails?.openNow === false ? '영업 종료' : '정보 없음'}
                </Text>
                {Array.isArray(placeDetails?.openingHours) && placeDetails.openingHours.length > 0 && (
                  <View style={styles.hoursBox}>
                    <Text style={styles.hoursTitle}>영업시간</Text>
                    {placeDetails.openingHours.map((hours, index) => (
                      <Text key={`${hours}-${index}`} style={styles.hoursText}>{hours}</Text>
                    ))}
                  </View>
                )}
                <Text style={styles.detailText}>📞 {placeDetails?.phone || '전화번호 정보 없음'}</Text>
                {!!placeDetails?.parking && <Text style={styles.detailText}>🚗 주차 정보: 제공됨</Text>}
                <View style={styles.actionRow}>
                  {!!placeDetails?.phone && (
                    <Pressable style={styles.actionButton} onPress={() => openPhone(placeDetails.phone)}>
                      <Text style={styles.actionButtonText}>전화</Text>
                    </Pressable>
                  )}
                  <Pressable style={[styles.actionButton, styles.primaryButton]} onPress={() => openDirections(selectedPlace)}>
                    <Text style={[styles.actionButtonText, styles.primaryText]}>길찾기</Text>
                  </Pressable>
                  {!!placeDetails?.website && (
                    <Pressable style={styles.actionButton} onPress={() => openWebsite(placeDetails.website)}>
                      <Text style={styles.actionButtonText}>웹사이트</Text>
                    </Pressable>
                  )}
                </View>
                {sheetMode === 'normal' && (
                  <Pressable onPress={() => switchSheet('expanded')} style={styles.expandButton}>
                    <Text style={styles.expandText}>상세정보 더 보기 ▲</Text>
                  </Pressable>
                )}
              </ScrollView>
            )}
          </>
        ) : (
          <>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {currentCategory ? `${currentCategory.icon} 주변 ${currentCategory.name}` : '📍 검색 기준 위치'}
                  {selectedCategory && !loading ? ` ${places.length}개` : ''}
                </Text>
                <Text style={styles.subTitle} numberOfLines={1}>
                  {loading ? '검색 중...' : selectedCategory ? '목록 또는 주황색 마커를 눌러 선택' : '카테고리를 선택해 검색하세요'}
                </Text>
              </View>
              {selectedCategory && (
                <Pressable style={styles.retryButton} onPress={() => searchPlaces(selectedCategory)}>
                  <Text style={styles.retryText}>재검색</Text>
                </Pressable>
              )}
            </View>
            {canShowFull && (
              <ScrollView
                style={styles.sheetScroll}
                contentContainerStyle={styles.sheetScrollContent}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {!!searchError && <Text style={styles.errorText}>{searchError}</Text>}
                {places.map((place, index) => (
                  <Pressable
                    key={`${place.id || 'place'}-${index}`}
                    onPress={() => handlePlacePress(place)}
                    style={styles.placeItem}
                  >
                    <View style={styles.placeItemContent}>
                      <Text style={styles.placeName} numberOfLines={1}>{place.name || '이름 없는 장소'}</Text>
                      <Text style={styles.placeAddress} numberOfLines={1}>{place.address || '주소 정보 없음'}</Text>
                      <Text style={styles.placeDistance}>{formatDistance(place.distance)}</Text>
                    </View>
                    <Text style={styles.arrow}>›</Text>
                  </Pressable>
                ))}
                {places.length === 0 && !loading && !searchError && (
                  <Text style={styles.emptyText}>주변 장소를 검색하면 여기에 목록이 나타납니다.</Text>
                )}
                <View style={styles.locationInfo}>
                  <Text style={styles.locationInfoTitle}>검색 기준 위치</Text>
                  <Text style={styles.coordinateText}>위도: {selectedLocation.latitude.toFixed(5)}</Text>
                  <Text style={styles.coordinateText}>경도: {selectedLocation.longitude.toFixed(5)}</Text>
                  <Text style={styles.hintText}>지도를 길게 눌러 기준 위치를 변경할 수 있습니다.</Text>
                </View>
              </ScrollView>
            )}
          </>
        )}
        {sheetMode === 'collapsed' && dragHeight == null && (
          <Pressable style={styles.expandButton} onPress={() => switchSheet('normal')}>
            <Text style={styles.expandText}>펼치기 ▲</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF4F4' },
  map: { ...StyleSheet.absoluteFillObject },
  topContainer: { position: 'absolute', top: 45, left: 12, right: 12 },
  header: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    marginBottom: 9, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1,
    shadowRadius: 5, shadowOffset: { width: 0, height: 2 },
  },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#183042' },
  categoryScroll: { flexGrow: 0 },
  categoryContent: { paddingVertical: 4, paddingHorizontal: 2, gap: 8 },
  categoryButton: {
    backgroundColor: '#FFFFFF', borderRadius: 22, paddingHorizontal: 13,
    paddingVertical: 11, flexDirection: 'row', alignItems: 'center', elevation: 2,
  },
  selectedButton: { backgroundColor: '#087F79' },
  categoryIcon: { fontSize: 15, marginRight: 5 },
  categoryText: { fontSize: 13, color: '#334155', fontWeight: '600' },
  selectedText: { color: '#FFFFFF' },
  loadingBox: {
    position: 'absolute', top: 157, alignSelf: 'center', flexDirection: 'row',
    alignItems: 'center', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, backgroundColor: 'white', elevation: 4,
  },
  loadingText: { marginLeft: 8, fontSize: 13, color: '#334155' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 23,
    borderTopRightRadius: 23, overflow: 'hidden', elevation: 9,
    shadowColor: '#000000', shadowOpacity: 0.14,
    shadowRadius: 12, shadowOffset: { width: 0, height: -4 },
  },
  handleTouchArea: { height: 37, alignItems: 'center', justifyContent: 'center' },
  handleBar: { width: 54, height: 5, borderRadius: 5, backgroundColor: '#AAB7B6' },
  handleHint: { fontSize: 9, color: '#94A3B8', marginTop: 3 },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17,
    paddingBottom: 12, borderBottomColor: '#E2E8F0', borderBottomWidth: 1,
  },
  sheetHeaderText: { flex: 1, paddingRight: 8 },
  sheetTitle: { fontWeight: 'bold', fontSize: 18, color: '#183042' },
  subTitle: { color: '#667885', fontSize: 12, marginTop: 4 },
  closeButton: { paddingHorizontal: 10, paddingVertical: 6 },
  closeText: { fontSize: 20, color: '#667885' },
  retryButton: { backgroundColor: '#E0F2EF', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 9 },
  retryText: { color: '#087F79', fontWeight: 'bold', fontSize: 12 },
  sheetScroll: { flex: 1 },
  sheetScrollContent: { paddingHorizontal: 17, paddingBottom: 22 },
  placeItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  placeItemContent: { flex: 1 },
  placeName: { color: '#183042', fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  placeAddress: { color: '#64748B', fontSize: 12, marginBottom: 4 },
  placeDistance: { fontSize: 12, color: '#087F79', fontWeight: '600' },
  arrow: { fontSize: 24, color: '#94A3B8', marginHorizontal: 5 },
  inlineLoading: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  detailText: { color: '#334155', fontSize: 14, marginTop: 14, lineHeight: 21 },
  errorText: { color: '#B91C1C', fontSize: 13, lineHeight: 20, marginTop: 12 },
  hoursBox: { backgroundColor: '#F1F5F9', borderRadius: 10, padding: 11, marginTop: 14 },
  hoursTitle: { fontWeight: 'bold', color: '#183042', marginBottom: 7 },
  hoursText: { color: '#475569', fontSize: 12, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 9, marginTop: 19 },
  actionButton: {
    flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center',
    justifyContent: 'center', backgroundColor: '#E0F2EF',
  },
  primaryButton: { backgroundColor: '#087F79' },
  actionButtonText: { color: '#087F79', fontWeight: 'bold', fontSize: 13 },
  primaryText: { color: '#FFFFFF' },
  expandButton: { alignItems: 'center', paddingVertical: 10 },
  expandText: { color: '#087F79', fontWeight: 'bold', fontSize: 12 },
  locationInfo: { marginTop: 12, paddingTop: 13, borderTopColor: '#E2E8F0', borderTopWidth: 1 },
  locationInfoTitle: { fontSize: 13, fontWeight: 'bold', color: '#64748B', marginBottom: 5 },
  coordinateText: { fontSize: 12, color: '#475569', marginTop: 3 },
  hintText: { fontSize: 11, color: '#94A3B8', marginTop: 8 },
  emptyText: { fontSize: 13, color: '#64748B', paddingVertical: 20 },
});
