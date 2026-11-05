import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

// 연한 초록색 둥근 "+ 품목 추가" 버튼 (직접 입력, 영수증 인식 결과, 지출 상세에서 공통 사용)
export default function AddItemButton({ label, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
    >
      <MaterialCommunityIcons name="plus" size={24} color={colors.green} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.tabActiveBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    marginLeft: 8,
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.green,
  },
});
