import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './AppText';
import { colors, fonts } from '../theme';

// 목록 화면 맨 위의 연한 초록 요약 카드 (할 일, 생활 루틴 공통). label / title / description
export default function SummaryBanner({ label, title, description }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: colors.heroBg,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
    color: colors.green,
  },
  title: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  description: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
