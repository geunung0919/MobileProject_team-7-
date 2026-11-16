import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Text from './AppText';
import { colors, fonts } from '../theme';

// 필터 칩 (예: "전체 6", "유통기한 임박 3")
export default function Chip({ label, count, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
        {count !== undefined ? `  ${count}` : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.tabActiveBg,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.textSecondary,
  },
  labelSelected: {
    fontFamily: fonts.bold,
    color: colors.green,
  },
});
