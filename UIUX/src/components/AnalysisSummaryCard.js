import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './AppText';
import { colors, fonts, radius } from '../theme';
import { formatNumber } from '../utils/format';

// 소비 분석 상단의 지출금 / 예산 / 남은 예산 카드
export default function AnalysisSummaryCard({
  periodLabel, // 예: '2026년 10월'
  spentLabel,
  spent,
  budgetLabel,
  budget,
  remainingLabel,
}) {
  const remaining = budget - spent;
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.period}>{periodLabel}</Text>
        <Text style={styles.spentLabel}>{spentLabel}</Text>
      </View>
      <Text style={styles.bigText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {formatNumber(spent)}
        <Text style={styles.bigUnit}>원</Text>
      </Text>
      <View style={styles.divider} />
      <View style={styles.bottomRow}>
        <View style={styles.left}>
          <Text style={styles.subLabel}>{budgetLabel}</Text>
          <Text style={styles.budgetValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{formatNumber(budget)}원</Text>
        </View>
        <View style={[styles.left, styles.right]}>
          <Text style={styles.subLabel}>{remainingLabel}</Text>
          <Text style={styles.remainingValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{formatNumber(remaining)}원</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 22,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    borderRadius: radius.card,
    backgroundColor: colors.heroBg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  period: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.green,
  },
  spentLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  bigText: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 38,
    lineHeight: 52,
    color: colors.textPrimary,
  },
  bigUnit: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  divider: {
    marginTop: 10,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: colors.divider,
  },
  bottomRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
  subLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  budgetValue: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.textPrimary,
  },
  remainingValue: {
    marginTop: 2,
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.green,
  },
});
