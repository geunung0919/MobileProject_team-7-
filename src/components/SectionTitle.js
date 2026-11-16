import React from 'react';
import { StyleSheet } from 'react-native';
import Text from './AppText';
import { colors, fonts } from '../theme';

// 화면 안의 섹션 제목 (예: "계정 관리", "앱 이용 안내")
export default function SectionTitle({ children, style }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
  },
});
