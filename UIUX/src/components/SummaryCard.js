import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../theme';

// 홈의 "소비" / "냉장고" 요약 카드의 공통 틀.
// 내용(children)은 각 카드에서 채우고, 이동 동작은 onPress 로 연결합니다.
export default function SummaryCard({ title, onPress, children }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
      {children}
    </Pressable>
  );
}

export const summaryStyles = StyleSheet.create({
  label: {
    marginTop: 14,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  bigRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  bigText: {
    fontFamily: fonts.bold,
    fontSize: 27,
    lineHeight: 40,
    color: colors.textPrimary,
  },
  unit: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    height: 176,
    backgroundColor: colors.cardBg,
    borderRadius: radius.card,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 18,
  },
  pressed: {
    opacity: 0.85,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
});
