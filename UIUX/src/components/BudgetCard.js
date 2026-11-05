import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../theme';
import { formatNumber } from '../utils/format';

// 소비 화면 상단의 "이번 달 남은 예산" 카드 (진행 바 포함)
export default function BudgetCard({ budget, spent }) {
  const remaining = budget - spent;
  // 예산이 0 이하이면 나눌 수 없으니, 쓴 돈이 있을 때만 100% 로 보여 줍니다.
  const usedPercent =
    budget > 0
      ? Math.min(100, Math.max(0, Math.round((spent / budget) * 100)))
      : spent > 0
        ? 100
        : 0;
  const leftPercent = 100 - usedPercent;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>이번 달 남은 예산</Text>
      <View style={styles.bigRow}>
        <Text style={styles.bigText}>{formatNumber(remaining)}</Text>
        <Text style={styles.bigUnit}>원</Text>
      </View>

      <View style={styles.progressLabels}>
        <Text style={styles.progressText}>예산의 {usedPercent}%를 사용했어요</Text>
        <Text style={styles.leftText}>{leftPercent}% 남음</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${usedPercent}%` }]} />
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.subLabel}>이번 달 지출금</Text>
          <Text style={styles.spentValue}>{formatNumber(spent)}원</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.subLabel}>이번 달 예산</Text>
          <Text style={styles.budgetValue}>{formatNumber(budget)}원</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.heroBg,
    borderRadius: radius.card,
    paddingHorizontal: 24,
    paddingVertical: 22,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.green,
  },
  bigRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  bigText: {
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
  progressLabels: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: colors.textSecondary,
  },
  leftText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.green,
  },
  track: {
    marginTop: 8,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.greenLight,
  },
  divider: {
    marginTop: 16,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: colors.divider,
  },
  bottomRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  right: {
    alignItems: 'flex-end',
  },
  subLabel: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: colors.textSecondary,
  },
  spentValue: {
    marginTop: 2,
    fontFamily: fonts.bold,
    fontSize: 21,
    color: colors.textPrimary,
  },
  budgetValue: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 21,
    color: colors.textSecondary,
  },
});
