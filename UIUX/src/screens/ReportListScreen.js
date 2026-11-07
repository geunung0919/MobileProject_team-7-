import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import { reportTexts, pastReports } from '../data/lifeInfo/reports';
import { spendingData } from '../data/spending/spending';
import { useAppData } from '../store/AppDataContext';
import { buildPastReport, getBudgetTag } from '../utils/reportSummary';
import { formatNumber, pad } from '../utils/format';
import { colors, fonts, spacing } from '../theme';

const CHART_HEIGHT = 80;

// 생활정보 > AI 자취 매니저 > 지난 리포트 (월별 예산 사용률 + 리포트 목록). 누르면 리포트 상세로 이동합니다.
export default function ReportListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const t = reportTexts.list;
  const { transactions } = useAppData();

  // 지난 리포트 (최근 달이 위)
  const reports = useMemo(() => {
    const now = new Date();
    return pastReports
      .map((snapshot) => buildPastReport(snapshot, now))
      .sort((a, b) => b.year * 12 + b.month - (a.year * 12 + a.month));
  }, []);

  // 차트: 지난 리포트(오래된 순) + 이번 달
  const bars = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
    const spent = transactions.filter((x) => x.date.startsWith(monthKey)).reduce((s, x) => s + x.amount, 0);
    const current = {
      id: 'current',
      month: now.getMonth() + 1,
      percent: Math.round((spent / spendingData.budget) * 100),
      isCurrent: true,
    };
    const past = [...reports].reverse().map((r) => ({ id: r.id, month: r.month, percent: r.usedPercent }));
    return [...past, current];
  }, [reports, transactions]);

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
        <BackHeader title={t.title} subtitle={t.subtitle} onBack={() => navigation.goBack()} />

        <View style={styles.chartCard}>
          <View style={styles.chartHead}>
            <Text style={styles.muted}>{t.chartTitle}</Text>
            <Text style={styles.muted}>%</Text>
          </View>
          <View style={styles.chartRow}>
            {bars.map((b) => (
              <View key={b.id} style={styles.barCol}>
                <Text style={[styles.barValue, b.isCurrent && styles.barCurrentText]}>{b.percent}</Text>
                <View
                  style={[
                    styles.bar,
                    b.isCurrent && styles.barCurrent,
                    { height: Math.max(4, (Math.min(b.percent, 100) / 100) * CHART_HEIGHT) },
                  ]}
                />
                <Text style={[styles.barLabel, b.isCurrent && styles.barCurrentText]}>{b.month}월</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t.listTitle}</Text>
        {reports.length === 0 ? <Text style={styles.empty}>{t.emptyText}</Text> : null}
        {reports.map((r) => {
          const tag = getBudgetTag(r.usedPercent);
          return (
            <Pressable
              key={r.id}
              onPress={() => navigation.navigate('ReportDetail', { reportId: r.id })}
              accessibilityRole="button"
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <View style={styles.itemTexts}>
                <View style={styles.itemTitleRow}>
                  <Text style={styles.itemTitle}>{r.month}월 리포트</Text>
                  <View style={[styles.tag, tag.warn && styles.tagWarn]}>
                    <Text style={[styles.tagText, tag.warn && styles.tagTextWarn]}>{tag.label}</Text>
                  </View>
                </View>
                <Text style={styles.itemStats}>
                  지출 {formatNumber(r.spent)}원 · 예산의 {r.usedPercent}%
                </Text>
                <Text style={styles.itemComment} numberOfLines={2}>
                  {r.comment}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  muted: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  chartCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
  },
  chartHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    marginVertical: 5,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: colors.badgeBg,
  },
  barCurrent: {
    backgroundColor: colors.green,
  },
  barValue: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  barLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  barCurrentText: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 10,
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  empty: {
    paddingVertical: 28,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
  item: {
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
  },
  pressed: {
    opacity: 0.75,
  },
  itemTexts: {
    flex: 1,
    marginRight: 8,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: colors.tabActiveBg,
  },
  tagWarn: {
    backgroundColor: colors.warnBg,
  },
  tagText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    color: colors.green,
  },
  tagTextWarn: {
    color: colors.warnText,
  },
  itemStats: {
    marginTop: 6,
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: colors.textPrimary,
  },
  itemComment: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.textSecondary,
  },
});
