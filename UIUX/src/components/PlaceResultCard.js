
import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, emergencyColors as c } from '../theme';

// 거리 표시: m 또는 km
const formatDistance = (distance) => {
  if (
    distance === null ||
    distance === undefined ||
    !Number.isFinite(Number(distance))
  ) {
    return '거리 정보 없음';
  }

  const meters = Number(distance);

  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }

  return `${Math.round(meters)}m`;
};

// 영업 상태
const getOpenStatus = (openNow) => {
  if (openNow === true) {
    return {
      label: '영업 중',
      color: '#16815D',
      background: '#E7F6EF',
    };
  }

  if (openNow === false) {
    return {
      label: '영업 종료',
      color: '#C34242',
      background: '#FCEEEE',
    };
  }

  return {
    label: '영업 정보 없음',
    color: '#687782',
    background: '#F0F2F4',
  };
};

// 영업시간 데이터가 없는 경우도 처리
const getOpeningHours = (openingHours) => {
  if (
    !Array.isArray(openingHours) ||
    openingHours.length === 0
  ) {
    return '영업시간 정보 없음';
  }

  // Google Places weekdayDescriptions 예:
  // "금요일: 오전 9:00~오후 9:00"
  const today = new Date().getDay();

  // Google Places weekdayDescriptions:
  // 월요일부터 일요일 순서
  const index = today === 0 ? 6 : today - 1;

  return openingHours[index] || '영업시간 정보 없음';
};

export default function PlaceResultCard({
  place,
  onPress,
  onDirections,
}) {
  if (!place) return null;

  const status = getOpenStatus(place.openNow);
  const openingHours = getOpeningHours(place.openingHours);

  const rating =
    place.rating !== null &&
    place.rating !== undefined
      ? Number(place.rating).toFixed(1)
      : '정보 없음';

  const reviewCount =
    place.reviewCount !== null &&
    place.reviewCount !== undefined
      ? `${place.reviewCount}개`
      : '정보 없음';

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.mainContent}
        onPress={() => onPress?.(place)}
      >
        {/* 기본 이미지 영역 */}
        <View style={styles.imagePlaceholder}>
          <MaterialCommunityIcons
            name="silverware-fork-knife"
            size={32}
            color="#8FA7A3"
          />
          <Text style={styles.imageText}>
            기본 이미지
          </Text>
        </View>

        {/* 장소 정보 */}
        <View style={styles.info}>
          <Text
            style={styles.name}
            numberOfLines={1}
          >
            {place.name || '이름 없음'}
          </Text>

          <View style={styles.ratingRow}>
            <MaterialCommunityIcons
              name="star"
              size={16}
              color="#E9AA36"
            />

            <Text style={styles.ratingText}>
              {rating}
            </Text>

            <Text style={styles.reviewText}>
              리뷰 {reviewCount}
            </Text>
          </View>

          <Text style={styles.distance}>
            {formatDistance(place.distance)}
          </Text>

          <Text
            style={styles.hours}
            numberOfLines={2}
          >
            {openingHours}
          </Text>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: status.background },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: status.color },
              ]}
            >
              {status.label}
            </Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.actionRow}>
        <Pressable
          style={styles.detailButton}
          onPress={() => onPress?.(place)}
        >
          <MaterialCommunityIcons
            name="information-outline"
            size={17}
            color={c.accent}
          />
          <Text style={styles.detailButtonText}>
            상세정보
          </Text>
        </Pressable>

        <Pressable
          style={styles.directionsButton}
          onPress={() => onDirections?.(place)}
        >
          <MaterialCommunityIcons
            name="navigation"
            size={17}
            color={colors.white}
          />
          <Text style={styles.directionsButtonText}>
            길찾기
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5EBEA',
    elevation: 2,
  },

  mainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#E8F0EE',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  imageText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: '#718E89',
  },

  info: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },

  name: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: c.text,
    marginBottom: 5,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },

  ratingText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: c.text,
  },

  reviewText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: c.textSecondary,
    marginLeft: 4,
  },

  distance: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: c.text,
    marginBottom: 3,
  },

  hours: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: c.textSecondary,
    marginBottom: 6,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },

  statusText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5EBEA',
  },

  detailButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: c.accent,
    borderRadius: 10,
    paddingVertical: 10,
  },

  detailButtonText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: c.accent,
  },

  directionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: c.accent,
    borderRadius: 10,
    paddingVertical: 10,
  },

  directionsButtonText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
  },
});
