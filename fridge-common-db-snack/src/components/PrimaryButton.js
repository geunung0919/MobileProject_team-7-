import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';

// 진한 초록색 가로 전체 버튼 ("저장하기", "선택 완료" 등)
export default function PrimaryButton({ label, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.white,
  },
});
