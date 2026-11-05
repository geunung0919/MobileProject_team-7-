import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';

// 모든 탭 화면 상단의 제목 영역.
// - rightText: 오른쪽에 회색 글씨 (예: 날짜)
// - right: 오른쪽에 임의의 요소 (예: 월 선택기). rightText 보다 우선합니다.
// - subtitle: 제목 아래 한 줄 설명
export default function ScreenHeader({ title, rightText, right, subtitle }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        {right ?? (rightText ? <Text style={styles.rightText}>{rightText}</Text> : null)}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.textPrimary,
  },
  rightText: {
    fontFamily: fonts.regular,
    fontSize: 14.5,
    color: colors.textSecondary,
  },
  subtitle: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
});
