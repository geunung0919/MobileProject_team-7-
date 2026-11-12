import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// 제목 옆의 작은 "뒤로 가기" 버튼 (제목 줄이 없는 화면용. 제목 줄이 있으면 BackHeader)
export default function BackButton({ onPress, color = colors.textPrimary, style }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="뒤로 가기"
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
    >
      <Ionicons name="chevron-back" size={28} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginLeft: -4, // 아이콘 안쪽 여백만큼 당겨 왼쪽 여백과 맞춤
  },
  pressed: {
    opacity: 0.6,
  },
});
