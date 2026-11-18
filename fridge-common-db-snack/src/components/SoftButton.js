import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

// 연한 초록 배경의 가로 전체 버튼 ("소비 분석 보기", "AI 레시피 추천")
export default function SoftButton({ label, icon, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={24} color={colors.green} /> : null}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 22,
    backgroundColor: colors.tabActiveBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    marginLeft: 10,
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.green,
  },
});
