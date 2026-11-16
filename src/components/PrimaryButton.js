import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Text from './AppText';
import { colors, fonts } from '../theme';

// 진한 초록색 가로 전체 버튼 ("저장하기", "선택 완료" 등). variant="soft" 는 연한 초록 바탕에 초록 글자 (보조 버튼)
export default function PrimaryButton({ label, onPress, style, variant = 'primary' }) {
  const soft = variant === 'soft';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, soft && styles.buttonSoft, pressed && styles.pressed, style]}
    >
      <Text style={[styles.label, soft && styles.labelSoft]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSoft: {
    backgroundColor: colors.tabActiveBg,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.white,
  },
  labelSoft: {
    color: colors.green,
  },
});
