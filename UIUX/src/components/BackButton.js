import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// 제목 옆에 두는 작은 "뒤로 가기" 화살표 버튼 (탭 바가 보이는 하위 화면용).
// 제목 줄이 따로 없는 화면에서 쓰고, 제목 줄이 있는 화면은 BackHeader 를 쓰세요.
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
    marginLeft: -4, // 아이콘 안쪽 여백만큼 당겨서 화면 왼쪽 여백과 글자 시작선을 맞춥니다.
  },
  pressed: {
    opacity: 0.6,
  },
});
