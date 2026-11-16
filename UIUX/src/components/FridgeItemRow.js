import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from './AppText';
import IconBox from './IconBox';
import { colors, fonts } from '../theme';
import { formatDotDate } from '../utils/format';
import { badgeDueLabel } from '../utils/recipes';

// 냉장고 식재료 목록의 한 줄. daysLeft: 유통기한까지 남은 일수, urgent: 임박 여부
export default function FridgeItemRow({
  name,
  quantity,
  expiry,
  icon,
  daysLeft,
  urgent,
  isLast,
  onPress,
}) {
  const badgeLabel = badgeDueLabel(daysLeft);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, !isLast && styles.divider, pressed && styles.pressed]}
    >
      <IconBox name={icon} />
      <View style={styles.texts}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.quantity}>{quantity}</Text>
      </View>
      <View style={styles.right}>
        <View style={[styles.badge, urgent ? styles.badgeUrgent : styles.badgeNormal]}>
          <Text style={[styles.badgeText, urgent ? styles.badgeTextUrgent : styles.badgeTextNormal]}>
            {badgeLabel}
          </Text>
        </View>
        <Text style={styles.date}>{formatDotDate(expiry)}까지</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: colors.divider,
  },
  pressed: {
    opacity: 0.7,
  },
  texts: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontFamily: fonts.medium,
    fontSize: 17,
    color: colors.textPrimary,
  },
  quantity: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  right: {
    alignItems: 'flex-end',
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeUrgent: {
    backgroundColor: colors.warnBg,
  },
  badgeNormal: {
    backgroundColor: colors.calmBg,
  },
  badgeText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  badgeTextUrgent: {
    color: colors.warnText,
  },
  badgeTextNormal: {
    color: colors.textSecondary,
  },
  date: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
});
