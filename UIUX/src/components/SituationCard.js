import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors, fonts, emergencyColors as c } from '../theme';

// 비상매뉴얼의 상황 선택 카드.
// - tone "default": 흰 배경 + 진한 아이콘 (긴급·안전)
// - tone "accent": 연한 회색 배경 + 초록 아이콘 (생활 문제)
export default function SituationCard({ title, icon, family, tone = 'default', onPress }) {
  const Icon = family === 'ion' ? Ionicons : MaterialCommunityIcons;
  const isAccent = tone === 'accent';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.card,
        isAccent ? styles.cardAccent : styles.cardDefault,
        pressed && styles.pressed,
      ]}
    >
      <Icon name={icon} size={22} color={isAccent ? c.accent : c.text} />
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    height: 74,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    paddingTop: 11,
    paddingBottom: 13,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  cardDefault: {
    backgroundColor: colors.white,
  },
  cardAccent: {
    backgroundColor: c.surface,
  },
  pressed: {
    opacity: 0.8,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: c.text,
  },
});
