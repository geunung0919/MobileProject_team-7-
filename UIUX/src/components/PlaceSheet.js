import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from './AppText';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

export const PLACE_SHEET_MIN_HEIGHT = 138;

// 자취생존맵 하단의 선택된 장소 카드 (place 가 없으면 emptyText 를 보여 줍니다).
export default function PlaceSheet({
  title,
  place,
  categoryLabel,
  emptyText,
  onPressHeader,
  onDirections,
  style,
}) {
  const meta = place ? [categoryLabel, place.distance].filter(Boolean).join(' · ') : '';

  return (
    <View style={[styles.card, style]}>
      <Pressable
        onPress={onPressHeader}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={styles.header}
      >
        <MaterialCommunityIcons name="format-list-bulleted" size={18} color={colors.textSecondary} />
        <Text style={styles.headerText}>{title}</Text>
        <View style={styles.flex} />
        <Ionicons name="chevron-up" size={20} color={colors.textSecondary} />
      </Pressable>

      {place ? (
        <View style={styles.row}>
          <View style={styles.texts}>
            <Text style={styles.name} numberOfLines={1}>
              {place.name}
            </Text>
            {meta ? <Text style={styles.meta}>{meta}</Text> : null}
            {place.address ? (
              <Text style={styles.address} numberOfLines={1}>
                {place.address}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => onDirections(place)}
            accessibilityRole="button"
            accessibilityLabel={`${place.name} 길찾기`}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Ionicons name="navigate-outline" size={22} color={colors.white} />
            <Text style={styles.buttonText}>길찾기</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.empty}>{emptyText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: PLACE_SHEET_MIN_HEIGHT,
    borderRadius: 20,
    backgroundColor: colors.white,
    paddingTop: 12,
    paddingHorizontal: 18,
    paddingBottom: 18,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  flex: {
    flex: 1,
  },
  header: {
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 4,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  row: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  texts: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  address: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  button: {
    width: 68,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  buttonText: {
    marginTop: 2,
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.white,
  },
  empty: {
    marginTop: 18,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
