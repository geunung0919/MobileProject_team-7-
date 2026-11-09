import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from './AppText';
import { Ionicons } from '@expo/vector-icons';
import IconBox from './IconBox';
import { colors, fonts, radius } from '../theme';

// 비상매뉴얼 하단의 "AI에게 물어보기" 카드 (연한 초록 배경 + 반짝이 아이콘 + 화살표)
export default function AiAskCard({ label, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}
    >
      <IconBox
        name="creation"
        size={52}
        borderRadius={18}
        iconColor={colors.green}
        backgroundColor={colors.badgeBg}
      />
      <Text style={styles.label}>{label}</Text>
      <Ionicons name="arrow-forward" size={22} color={colors.green} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.card,
    backgroundColor: colors.heroBg,
    padding: 20,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    flex: 1,
    marginLeft: 14,
    fontFamily: fonts.bold,
    fontSize: 19,
    color: colors.textPrimary,
  },
});
