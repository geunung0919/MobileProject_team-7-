import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnalysisSummaryCard from '../components/AnalysisSummaryCard';
import SegmentedControl from '../components/SegmentedControl';
import DonutChart from '../components/DonutChart';
import MonthlyBarChart from '../components/MonthlyBarChart';
import { analysisData, analysisTexts } from '../data/spending/spendingAnalysis';
import { formatNumber } from '../utils/format';
import { colors, fonts, spacing } from '../theme';

const MINUS = '−'; // 숫자 앞 마이너스 기호(−)

// 전월 대비 증감 문구: 0 -> '—', 양수 -> '+90,000원', 음수 -> '−40,000원'
const formatDiff = (diff) => {
  if (diff == null || diff === 0) return '—';
  return `${diff > 0 ? '+' : MINUS}${formatNumber(Math.abs(diff))}원`;
};

export default function SpendingAnalysisScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('category');
  const { period, budget, spent, categories, months } = analysisData;
  const t = analysisTexts;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingHorizontal: spacing.screenX,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
          >
            <Ionicons name="arrow-back" size={28} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>{t.title}</Text>
        </View>

        <AnalysisSummaryCard
          periodLabel={`${period.year}년 ${period.month}월`}
          spentLabel={t.periodSpentLabel}
          spent={spent}
          budgetLabel={t.budgetLabel}
          budget={budget}
          remainingLabel={t.remainingLabel}
        />

        <View style={styles.tabs}>
          <SegmentedControl options={t.tabs} value={tab} onChange={setTab} showCheck={false} />
        </View>

        {tab === 'category' ? (
          <CategoryTab categories={categories} />
        ) : (
          <MonthTab months={months} year={period.year} />
        )}
      </ScrollView>
    </View>
  );
}

// 탭 1: 카테고리별 지출 (도넛 차트 + 목록)
function CategoryTab({ categories }) {
  const t = analysisTexts;
  const sum = categories.reduce((s, c) => s + c.amount, 0);

  // 지출이 하나도 없으면 퍼센트를 나눌 수 없으니 안내 글만 보여 줍니다.
  if (categories.length === 0 || sum <= 0) {
    return (
      <View>
        <SectionHeader title={t.categoryTitle} subtitle={t.categorySubtitle} />
        <Text style={styles.emptyText}>{t.emptyText}</Text>
      </View>
    );
  }

  const rows = categories.map((c) => ({ ...c, percent: Math.round((c.amount / sum) * 100) }));
  const top = rows.reduce((a, b) => (b.amount > a.amount ? b : a), rows[0]);

  return (
    <View>
      <SectionHeader title={t.categoryTitle} subtitle={t.categorySubtitle} />

      <View style={styles.donutWrap}>
        <DonutChart segments={rows.map((r) => ({ value: r.amount, color: r.color }))}>
          <Text style={styles.donutLabel}>{t.topLabel}</Text>
          <Text style={styles.donutName}>{top.name}</Text>
          <Text style={styles.donutPercent}>{top.percent}%</Text>
        </DonutChart>
      </View>

      <View style={styles.list}>
        {rows.map((r) => (
          <View key={r.id} style={styles.categoryRow}>
            <View style={[styles.dot, { backgroundColor: r.color }]} />
            <Text style={styles.categoryName}>{r.name}</Text>
            <Text style={styles.categoryPercent}>{r.percent}%</Text>
            <Text style={styles.categoryAmount}>{formatNumber(r.amount)}원</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// 탭 2: 월별 소비 비교 (막대 차트 + 표)
function MonthTab({ months, year }) {
  const t = analysisTexts;
  const rows = months.map((m, i) => ({
    ...m,
    diff: i === 0 ? null : m.amount - months[i - 1].amount,
  }));
  const current = rows[rows.length - 1];
  const prev = rows[rows.length - 2];

  if (!current) {
    return (
      <View>
        <Text style={styles.emptyText}>{t.emptyText}</Text>
      </View>
    );
  }

  // 지난달과 비교한 제목/설명 (이번 달이 줄었는지, 늘었는지에 따라 문구가 바뀝니다)
  let title = '지난달과 같아요';
  let subtitle = '';
  if (prev && current.diff !== 0) {
    const less = current.diff < 0;
    // 지난달 지출이 0원이면 퍼센트를 계산할 수 없어서 퍼센트 없이 보여 줍니다.
    const percent = prev.amount > 0 ? Math.round((Math.abs(current.diff) / prev.amount) * 100) : null;
    title = `지난달보다 ${percent === null ? '' : `${percent}% `}${less ? '줄었어요' : '늘었어요'}`;
    subtitle = `${prev.month}월보다 ${formatNumber(Math.abs(current.diff))}원 ${less ? '덜' : '더'} 썼어요.`;
  }

  return (
    <View>
      <SectionHeader title={title} subtitle={subtitle} />

      <Text style={styles.unit}>{t.chartUnit}</Text>
      <MonthlyBarChart data={months} />

      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, styles.colMonth]}>{year}년</Text>
        <Text style={[styles.headerText, styles.colAmount]}>{t.tableSpentLabel}</Text>
        <Text style={[styles.headerText, styles.colDiff]}>{t.tableDiffLabel}</Text>
      </View>
      {rows.map((r, i) => {
        const isCurrent = i === rows.length - 1;
        return (
          <View key={r.month} style={[styles.tableRow, isCurrent && styles.currentRow]}>
            <Text style={[styles.cellMonth, styles.colMonth, isCurrent && styles.currentText]}>
              {r.month}월
            </Text>
            <Text style={[styles.cellAmount, styles.colAmount]}>{formatNumber(r.amount)}원</Text>
            <Text style={[styles.cellDiff, styles.colDiff, isCurrent && styles.currentText]}>
              {formatDiff(r.diff)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// 제목 + 설명 + 오른쪽 "예시 데이터" 라벨
function SectionHeader({ title, subtitle }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTexts}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.sampleBadge}>
        <Text style={styles.sampleBadgeText}>{analysisTexts.sampleBadge}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    marginTop: 32,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: 14,
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.textPrimary,
  },
  tabs: {
    marginTop: 22,
  },

  sectionHeader: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  sectionTexts: {
    flex: 1,
    paddingRight: 8,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 21,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
  sampleBadge: {
    marginTop: 2,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleBadgeText: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
  },

  // 카테고리 탭
  donutWrap: {
    marginTop: 18,
    alignItems: 'center',
  },
  donutLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  donutName: {
    marginTop: 2,
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  donutPercent: {
    fontFamily: fonts.bold,
    fontSize: 36,
    lineHeight: 46,
    color: colors.green,
  },
  list: {
    marginTop: 26,
  },
  categoryRow: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    flex: 1,
    marginLeft: 12,
    fontFamily: fonts.regular,
    fontSize: 18,
    color: colors.textPrimary,
  },
  categoryPercent: {
    width: 64,
    textAlign: 'right',
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.textSecondary,
  },
  categoryAmount: {
    width: 110,
    textAlign: 'right',
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
  },

  // 월별 탭
  unit: {
    marginTop: 18,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  colMonth: { flex: 1 },
  colAmount: { width: 110, textAlign: 'right' },
  colDiff: { width: 110, textAlign: 'right' },
  tableHeader: {
    marginTop: 22,
    paddingHorizontal: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  tableRow: {
    height: 46,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentRow: {
    marginTop: 4,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.heroBg,
  },
  cellMonth: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  cellAmount: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  cellDiff: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
  currentText: {
    fontFamily: fonts.bold,
    color: colors.green,
  },
});
