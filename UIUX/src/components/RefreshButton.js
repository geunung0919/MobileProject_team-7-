import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Text from './AppText';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

// 작은 "새로고침" 버튼. 초록색 큰 버튼(SoftButton)과 구분되도록 회색 테두리의 작은 알약 모양이고,
// 오른쪽 끝에 붙습니다. label 로 글자를 바꿀 수 있어요. 사용: <RefreshButton onPress={...} />
export default function RefreshButton({ onPress, label = '새로고침', disabled = false, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.button, style, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <MaterialCommunityIcons name="refresh" size={15} color={colors.textSecondary} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.checkboxBorder,
    backgroundColor: colors.white,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  label: {
    marginLeft: 4,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
});
