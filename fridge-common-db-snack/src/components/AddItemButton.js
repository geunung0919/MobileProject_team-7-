import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

// "+ 품목 추가" 버튼 (여러 화면 공통)
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
