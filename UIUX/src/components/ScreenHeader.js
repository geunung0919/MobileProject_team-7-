import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './AppText';
import { colors, fonts } from '../theme';

// 탭 화면 상단 제목 영역. rightText(오른쪽 회색 글씨), right(임의 요소, rightText 보다 우선), subtitle(아래 한 줄 설명)
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
