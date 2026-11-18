import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import AiSayCard from '../components/AiSayCard';
import { reportTexts, pastReports } from '../data/lifeInfo/reports';
import { spendingData } from '../data/spending/spending';
import { fridgeData } from '../data/fridge/fridge';
import { useAppData } from '../store/AppDataContext';
import { getMonthlyReport, buildPastReport } from '../utils/reportSummary';
import { formatNumber, toDateString } from '../utils/format';
import { colors, fonts, spacing, emergencyColors } from '../theme';

// 생활정보 > AI 자취 매니저 > 리포트 상세. params: { reportId } (없으면 이번 달 리포트)
export default function ReportDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const t = reportTexts.detail;
  const reportId = route.params?.reportId;
  const { transactions, fridgeItems } = useAppData();

  const report = useMemo(() => {
    const now = new Date();
    const snapshot = reportId ? pastReports.find((r) => r.id === reportId) : null;
    if (snapshot) return buildPastReport(snapshot, now);
    return getMonthlyReport({
      transactions,
      fridgeItems,
      budget: spendingData.budget,
      now,
      baseDate: toDateString(now),
      urgentWithinDays: fridgeData.urgentWithinDays,
    });
  }, [reportId, transactions, fridgeItems]);

  const { spent, budget, remaining, usedPercent, prevDiffPercent, categories, fridge } = report;
  const barWidth = `${Math.min(usedPercent, 100)}%`;
  const fridgeStats = [
    { key: 'total', value: fridge.total },
    { key: 'urgent', value: fridge.urgent, warn: fridge.urgent > 0 },
    { key: 'expired', value: fridge.expired, warn: fridge.expired > 0 },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: spacing.screenX,
        }}
      >
        <BackHeader
          title={`${report.month}월 리포트`}
          subtitle={report.periodLabel}
          onBack={() => navigation.goBack()}
        />

        <AiSayCard label={t.aiLabel} text={report.comment} />

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t.spendingTitle}</Text>
          {prevDiffPercent !== null ? (
            <Text style={styles.diffText}>
              지난달 같은 기간보다{' '}
              <Text style={prevDiffPercent > 0 ? styles.diffUp : styles.diffDown}>
                {prevDiffPercent > 0 ? '+' : ''}
                {prevDiffPercent}%
              </Text>
            </Text>
          ) : null}
        </View>
        <View style={styles.card}>
          <Text style={styles.muted}>지출 / 예산 {formatNumber(budget)}원</Text>
          <Text style={styles.big}>
            {formatNumber(spent)}
            <Text style={styles.bigUnit}>원</Text>
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: barWidth }, usedPercent > 100 && styles.fillOver]} />
          </View>
          <Text style={styles.muted}>
            {remaining >= 0
              ? `남은 예산 ${formatNumber(remaining)}원 · ${usedPercent}% 사용`
              : `예산 초과 ${formatNumber(-remaining)}원 · ${usedPercent}% 사용`}
          </Text>

          {categories.length > 0 ? (
            categories.map((c) => (
              <View key={c.name} style={styles.categoryRow}>
                <Text style={styles.categoryName}>{c.name}</Text>
                <View style={styles.categoryTrack}>
                  <View style={[styles.categoryFill, { width: `${c.percent}%` }]} />
                </View>
                <Text style={styles.categoryPercent}>{c.percent}%</Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>{t.noSpendingText}</Text>
          )}
        </View>

        <Text style={styles.sectionTitleSolo}>{t.fridgeTitle}</Text>
        <View style={styles.miniRow}>
          {fridgeStats.map((s) => (
            <View key={s.key} style={styles.mini}>
              <Text style={styles.muted}>{t.fridgeLabels[s.key]}</Text>
              <Text style={[styles.miniValue, s.warn && styles.miniWarn]}>
                {s.value}
                <Text style={styles.miniUnit}>개</Text>
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitleSolo}>{t.tipsTitle}</Text>
        <View style={styles.tipsCard}>
          {report.tips.map((tip, i) => (
            <View key={tip} style={[styles.tipRow, i > 0 && styles.tipRowNext]}>
              <View style={styles.tipNumber}>
                <Text style={styles.tipNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sectionRow: {
    marginTop: 24,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  sectionTitleSolo: {
    marginTop: 24,
    marginBottom: 10,
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  diffText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  diffUp: {
    fontFamily: fonts.bold,
    color: emergencyColors.danger,
  },
  diffDown: {
    fontFamily: fonts.bold,
    color: colors.green,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
  },
  muted: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  big: {
    marginTop: 2,
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.textPrimary,
  },
  bigUnit: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  track: {
    height: 8,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 4,
    backgroundColor: colors.divider,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.green,
  },
  fillOver: {
    backgroundColor: colors.warnText,
  },
  categoryRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    width: 70,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textPrimary,
  },
  categoryTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.divider,
    overflow: 'hidden',
  },
  categoryFill: {
    height: '100%',
    backgroundColor: colors.greenLight,
  },
  categoryPercent: {
    width: 44,
    textAlign: 'right',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  empty: {
    marginTop: 14,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  miniRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mini: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.cardBg,
  },
  miniValue: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  miniWarn: {
    color: colors.warnText,
  },
  miniUnit: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  tipsCard: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  tipRowNext: {
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: colors.divider,
  },
  tipNumber: {
    width: 22,
    height: 22,
    marginTop: 1,
    borderRadius: 11,
    backgroundColor: colors.tabActiveBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipNumberText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: colors.green,
  },
  tipText: {
    flex: 1,
    marginLeft: 10,
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.textPrimary,
  },
});
