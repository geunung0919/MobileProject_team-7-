import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

// 목록 왼쪽의 둥근 사각형 아이콘 박스
export default function IconBox({
  name,
  size = 42,
  iconColor = colors.textSecondary,
  backgroundColor = colors.cardBg,
  borderRadius = radius.icon,
}) {
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius, backgroundColor }]}>
      <MaterialCommunityIcons name={name} size={Math.round(size * 0.57)} color={iconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
