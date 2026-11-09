
import React, { useState, useRef } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';

import MapView, { Marker } from 'react-native-maps';

import {
  searchNearbyPlaces,
  getPlaceDetails,
} from '../api/placeApi';

const CATEGORIES = [
  { id: 'restaurant', name: '음식점', icon: '🍚' },
  { id: 'cafe', name: '카페', icon: '☕' },
  { id: 'convenience', name: '편의점', icon: '🏪' },
  { id: 'mart', name: '마트', icon: '🛒' },
  { id: 'hospital', name: '병원', icon: '🏥' },
  { id: 'laundry', name: '세탁소', icon: '🧺' },
];

const INITIAL_LOCATION = {
  latitude: 36.8002,
  longitude: 127.0749,
};

export default function MapScreen() {
  const [selectedLocation, setSelectedLocation] =
    useState(INITIAL_LOCATION);

  const [selectedCategory, setSelectedCategory] =
    useState(null);

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const searchRequestRef = useRef(0);
  const detailsRequestRef = useRef(0);

  const closeDetails = () => {
    detailsRequestRef.current += 1;
    setSelectedPlace(null);
    setPlaceDetails(null);
    setDetailsLoading(false);
    setDetailsError(null);
  };

  // 지도 빈 공간 클릭 시 위치 선택
  const handleMapPress = (event) => {
    // 마커 클릭 이벤트가 지도 클릭으로 전달되는 경우 방지
    if (event.nativeEvent.action === 'marker-press') {
      return;
    }

    const coordinate = event.nativeEvent.coordinate;

    if (!coordinate) {
      return;
    }

    console.log('지도 위치 선택:', coordinate);

    setSelectedLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });

    closeDetails();
  };

  // 카테고리 검색
  const handleCategoryPress = async (category) => {
    const nextCategory =
      selectedCategory === category.id ? null : category.id;

    const requestId = ++searchRequestRef.current;

    setSelectedCategory(nextCategory);
    setPlaces([]);
    setLoading(false);
    closeDetails();

    if (!nextCategory) {
      return;
    }

    try {
      setLoading(true);

      const results = await searchNearbyPlaces(
        selectedLocation.latitude,
        selectedLocation.longitude,
        nextCategory
      );

      if (requestId !== searchRequestRef.current) {
        return;
      }

      setPlaces(results);
      console.log('검색 완료:', results.length);
    } catch (error) {
      if (requestId !== searchRequestRef.current) {
        return;
      }

      console.error('검색 오류:', error.message);
      Alert.alert('검색 실패', error.message);
    } finally {
      if (requestId === searchRequestRef.current) {
        setLoading(false);
      }
    }
  };

  // 마커 클릭 시 상세정보 요청
  const handlePlacePress = async (place) => {
    console.log('마커 클릭:', place.name);

    const requestId = ++detailsRequestRef.current;

    setSelectedPlace(place);
    setPlaceDetails(null);
    setDetailsError(null);
    setDetailsLoading(true);

    try {
      const details = await getPlaceDetails(place.id);

      if (requestId !== detailsRequestRef.current) {
        return;
      }

      setPlaceDetails(details);
      console.log('상세정보 조회 성공:', details.name);
    } catch (error) {
      if (requestId !== detailsRequestRef.current) {
        return;
      }

      setDetailsError(error.message);
      console.error('상세정보 조회 오류:', error.message);
    } finally {
      if (requestId === detailsRequestRef.current) {
        setDetailsLoading(false);
      }
    }
  };

  const openWebsite = async (url) => {
    if (!url) return;

    try {
      const parsedUrl = new URL(url);

      if (
        parsedUrl.protocol !== 'https:' &&
        parsedUrl.protocol !== 'http:'
      ) {
        throw new Error('지원하지 않는 주소입니다.');
      }

      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('오류', '웹사이트를 열 수 없습니다.');
    }
  };

  const currentCategory = CATEGORIES.find(
    (category) => category.id === selectedCategory
  );

  const displayedPlace = placeDetails || selectedPlace;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        mapType="standard"
        initialRegion={{
          ...INITIAL_LOCATION,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        onPress={handleMapPress}
      >
        <Marker
          coordinate={selectedLocation}
          title="선택한 위치"
          pinColor="red"
          onPress={(event) => {
            event.stopPropagation();
          }}
        />

        {selectedCategory &&
          places
            .filter(
              (place) =>
                Number.isFinite(place.latitude) &&
                Number.isFinite(place.longitude)
            )
            .map((place) => (
              <Marker
                key={place.id}
                coordinate={{
                  latitude: place.latitude,
                  longitude: place.longitude,
                }}
                title={place.name}
                description={place.address}
                pinColor="orange"
                onPress={(event) => {
                  event.stopPropagation();
                  handlePlacePress(place);
                }}
              />
            ))}
      </MapView>

      <View style={styles.topContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>자취생존맵</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {CATEGORIES.map((category) => {
            const isSelected =
              selectedCategory === category.id;

            return (
              <Pressable
                key={category.id}
                onPress={() => handleCategoryPress(category)}
                style={[
                  styles.categoryButton,
                  isSelected && styles.selectedButton,
                ]}
              >
                <Text style={styles.categoryIcon}>
                  {category.icon}
                </Text>

                <Text
                  style={[
                    styles.categoryText,
                    isSelected && styles.selectedText,
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.loadingText}>
            주변 장소 검색 중...
          </Text>
        </View>
      )}

      {selectedPlace ? (
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTitle}>
              {displayedPlace?.name || '장소 정보'}
            </Text>

            <Pressable
              onPress={closeDetails}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {detailsLoading ? (
            <View style={styles.detailsLoadingBox}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.loadingText}>
                상세정보 불러오는 중...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.detailsScroll}
              showsVerticalScrollIndicator={false}
            >
              {detailsError && (
                <Text style={styles.errorText}>
                  상세정보 오류: {detailsError}
                </Text>
              )}

              <Text style={styles.detailText}>
                📍 {displayedPlace?.address || '주소 정보 없음'}
              </Text>

              {selectedPlace.distance != null && (
                <Text style={styles.detailText}>
                  📏 직선거리:{' '}
                  {selectedPlace.distance >= 1000
                    ? `${(selectedPlace.distance / 1000).toFixed(1)}km`
                    : `${selectedPlace.distance}m`}
                </Text>
              )}

              <Text style={styles.detailText}>
                ⭐ 평점:{' '}
                {placeDetails?.rating != null
                  ? placeDetails.rating.toFixed(1)
                  : '정보 없음'}
              </Text>

              <Text style={styles.detailText}>
                💬 리뷰 수:{' '}
                {placeDetails?.reviewCount != null
                  ? `${placeDetails.reviewCount}개`
                  : '정보 없음'}
              </Text>

              <Text style={styles.detailText}>
                🕒 영업 상태:{' '}
                {placeDetails?.openNow === true
                  ? '영업 중'
                  : placeDetails?.openNow === false
                    ? '영업 종료'
                    : '정보 없음'}
              </Text>

              {placeDetails?.openingHours?.length > 0 && (
                <View style={styles.hoursBox}>
                  <Text style={styles.hoursTitle}>영업시간</Text>

                  {placeDetails.openingHours.map(
                    (hours, index) => (
                      <Text key={index} style={styles.hoursText}>
                        {hours}
                      </Text>
                    )
                  )}
                </View>
              )}

              <Text style={styles.detailText}>
                📞 전화번호:{' '}
                {placeDetails?.phone || '정보 없음'}
              </Text>

              {placeDetails?.parking && (
                <Text style={styles.detailText}>
                  🚗 주차 정보: 제공됨
                </Text>
              )}

              {placeDetails?.website && (
                <Pressable
                  style={styles.websiteButton}
                  onPress={() =>
                    openWebsite(placeDetails.website)
                  }
                >
                  <Text style={styles.websiteText}>
                    웹사이트 열기
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          )}
        </View>
      ) : (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>
            {currentCategory
              ? `${currentCategory.icon} ${currentCategory.name}`
              : '📍 전체 카테고리'}
          </Text>

          {selectedCategory && (
            <Text style={styles.resultText}>
              검색된 장소: {places.length}개
            </Text>
          )}

          <Text style={styles.infoText}>선택한 위치</Text>

          <Text style={styles.coordinateText}>
            위도: {selectedLocation.latitude.toFixed(5)}
          </Text>

          <Text style={styles.coordinateText}>
            경도: {selectedLocation.longitude.toFixed(5)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  topContainer: {
    position: 'absolute',
    top: 50,
    left: 12,
    right: 12,
  },
  header: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    elevation: 4,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryContent: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 20,
    elevation: 3,
  },
  selectedButton: {
    backgroundColor: '#2563EB',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  selectedText: {
    color: 'white',
  },
  loadingBox: {
    position: 'absolute',
    top: 165,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    elevation: 4,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 13,
    color: '#333',
  },
  infoBox: {
    position: 'absolute',
    bottom: 30,
    left: 15,
    right: 15,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  coordinateText: {
    fontSize: 13,
    color: '#333',
    marginVertical: 2,
  },
  detailsCard: {
    position: 'absolute',
    bottom: 25,
    left: 12,
    right: 12,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    elevation: 6,
    maxHeight: '48%',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailsTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: 'bold',
    color: '#222',
    marginRight: 12,
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  closeText: {
    fontSize: 20,
    color: '#666',
  },
  detailsLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },
  detailsScroll: {
    flexGrow: 0,
  },
  detailsScroll: {
    flexGrow: 0,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    lineHeight: 21,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 10,
  },
  hoursBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  hoursTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  hoursText: {
    fontSize: 12,
    color: '#444',
    marginBottom: 3,
  },
  websiteButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  websiteText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
