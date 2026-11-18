
import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import {
  useIsFocused,
} from '@react-navigation/native';
import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import AnalysisSummaryCard from '../components/AnalysisSummaryCard';
import SegmentedControl from '../components/SegmentedControl';
import DonutChart from '../components/DonutChart';
import MonthlyBarChart from '../components/MonthlyBarChart';

import {
  analysisData,
  analysisTexts,
} from '../data/spending/spendingAnalysis';

import { useAppData } from '../store/AppDataContext';
import { loadBudget } from '../../../api/receiptApi';
import { formatNumber } from '../utils/format';
import { colors, fonts, spacing } from '../theme';

const MINUS = '−';

const PALETTE = [
  '#65C695',
  '#9ECCB6',
  '#C2D9A8',
  '#D9DED7',
  '#86B5D8',
  '#F5BE83',
  '#B4A0D8',
  '#ED9DA3',
  '#86C8C8',
  '#AAB3BF',
];

const SPENDING_CATEGORIES = [
  '식비',
  '생활용품',
  '교통비',
  '주거비',
  '통신비',
  '의료비',
  '문화·여가',
  '쇼핑',
  '기타',
];

// 기존 기록에서 카테고리가 없거나
// 입력 방식만 저장된 경우 별도 구분
const LEGACY_CATEGORIES = [
  '직접 입력',
  '영수증',
  '결제 가져오기',
];

const formatDiff = (diff) => {
  if (diff == null || diff === 0) return '—';

  return `${
    diff > 0 ? '+' : MINUS
  }${formatNumber(Math.abs(diff))}원`;
};

// YYYY-MM 변환
function monthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

// 선택한 월을 기준으로 과거 4개월 생성
function getRecentMonths(year, month) {
  return Array.from({ length: 4 }, (_, index) => {
    const date = new Date(
      year,
      month - 4 + index,
      1
    );

    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      key: monthKey(
        date.getFullYear(),
        date.getMonth() + 1
      ),
    };
  });
}

// 실제 소비 카테고리 판별
function getCategory(row) {
  const category = row.category;

  if (SPENDING_CATEGORIES.includes(category)) {
    return category;
  }

  if (
    !category ||
    LEGACY_CATEGORIES.includes(category)
  ) {
    return '미분류(이전 기록)';
  }

  return category;
}

export default function SpendingAnalysisScreen({
  navigation,
  route,
}) {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();

  const [tab, setTab] = useState('category');

  const {
    sharedReceipts,
    sharedUid,
    visibleShared,
  } = useAppData();

  const now = new Date();

  const year =
    route.params?.year ?? now.getFullYear();

  const month =
    route.params?.month ?? now.getMonth() + 1;

  const targetMonth = monthKey(year, month);

  // 로그인 사용자와 조회 데이터의 UID 일치 확인
  const sameUser =
    !!sharedUid &&
    visibleShared?.uid === sharedUid;

  const [budgetResult, setBudgetResult] = useState(null);
  const [budgetError, setBudgetError] = useState('');

  const budgetRequestKey = sharedUid
    ? `${sharedUid}:${targetMonth}`
    : null;

  // 선택한 달의 Firebase 예산 조회
  useEffect(() => {
    let active = true;

    setBudgetResult(null);
    setBudgetError('');

    if (
      !focused ||
      !sharedReceipts ||
      !sharedUid
    ) {
      return () => {
        active = false;
      };
    }

    loadBudget(targetMonth, sharedUid)
      .then((result) => {
        if (!active) return;

        setBudgetResult({
          key: `${sharedUid}:${targetMonth}`,
          data: result,
        });
      })
      .catch((error) => {
        if (!active) return;

        setBudgetError(
          error?.message ||
          '월 예산을 불러오지 못했어요.'
        );
      });

    return () => {
      active = false;
    };
  }, [
    focused,
    sharedReceipts,
    sharedUid,
    targetMonth,
  ]);

  // Firebase 소비 데이터 분석
  const live = useMemo(() => {
    const byCategory = new Map();
    const byMonth = new Map();

    const records = sameUser &&
      Array.isArray(visibleShared?.spending)
        ? visibleShared.spending
        : [];

    for (const row of records) {
      const key =
        typeof row.date === 'string'
          ? row.date.slice(0, 7)
          : null;

      const amount = Number(row.amount);

      if (
        !/^\d{4}-\d{2}$/.test(key || '') ||
        !Number.isFinite(amount) ||
        amount < 0
      ) {
        continue;
      }

      byMonth.set(
        key,
        (byMonth.get(key) ?? 0) + amount
      );

      if (key === targetMonth) {
        const category = getCategory(row);

        byCategory.set(
          category,
          (byCategory.get(category) ?? 0) + amount
        );
      }
    }

    const categories = [...byCategory]
      .map(([name, amount], index) => ({
        id: name,
        name,
        amount,
        color: PALETTE[index % PALETTE.length],
      }))
      .sort((a, b) => b.amount - a.amount);

    // 전년도까지 포함한 최근 4개월
    const months = getRecentMonths(year, month).map(
      (period) => ({
        ...period,
        amount: byMonth.get(period.key) ?? 0,
      })
    );

    return {
      period: { year, month },
      spent: byMonth.get(targetMonth) ?? 0,
      budget: null,
      categories,
      months,
    };
  }, [
    visibleShared,
    sameUser,
    year,
    month,
    targetMonth,
  ]);

  // Firebase 모드에서 예산 데이터 연결
  const currentBudget =
    budgetResult?.key === budgetRequestKey
      ? budgetResult.data
      : null;

  const budget = currentBudget?.budget ?? null;

  // 예산 API에서 반환하는 월 지출 합계를 우선 사용
  const spent =
    sharedReceipts
      ? (
          Number.isFinite(currentBudget?.spent)
            ? currentBudget.spent
            : live.spent
        )
      : analysisData.spent;

  const analysis = sharedReceipts
    ? {
        ...live,
        budget,
        spent,
      }
    : analysisData;

  const {
    period,
    categories,
    months,
  } = analysis;

  const available =
    !sharedReceipts ||
    (
      sameUser &&
      Array.isArray(visibleShared?.spending) &&
      !visibleShared?.spendingTruncated &&
      !visibleShared?.spendingError
    );

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
            <Ionicons
              name="arrow-back"
              size={28}
              color={colors.textPrimary}
            />
          </Pressable>

          <Text style={styles.title}>
            {t.title}
          </Text>
        </View>

        {!available ? (
          <Text
            accessibilityRole="alert"
            style={styles.errorText}
          >
            {!sharedUid
              ? '로그인 후 소비 분석을 확인해 주세요.'
              : visibleShared?.spendingError ||
                (
                  visibleShared?.spendingTruncated
                    ? '지출 기록 일부만 조회되어 정확한 분석을 표시할 수 없어요.'
                    : '서버 소비 기록을 불러오는 중이에요.'
                )}
          </Text>
        ) : (
          <>
            <AnalysisSummaryCard
              periodLabel={`${period.year}년 ${period.month}월`}
              spentLabel={t.periodSpentLabel}
              spent={analysis.spent}
              budgetLabel={t.budgetLabel}
              budget={analysis.budget}
              remainingLabel={t.remainingLabel}
            />

            {sharedReceipts && budgetError ? (
              <Text
                style={styles.errorText}
                accessibilityRole="alert"
              >
                예산 조회 오류: {budgetError}
              </Text>
            ) : null}

            {sharedReceipts &&
            currentBudget === null &&
            !budgetError ? (
              <Text style={styles.helperText}>
                월 예산을 확인하고 있어요.
              </Text>
            ) : null}

            <View style={styles.tabs}>
              <SegmentedControl
                options={
                  sharedReceipts
                    ? [
                        {
                          value: 'category',
                          label: '카테고리별 지출',
                        },
                        {
                          value: 'month',
                          label: '월별 지출',
                        },
                      ]
                    : t.tabs
                }
                value={tab}
                onChange={setTab}
                showCheck={false}
              />
            </View>

            {tab === 'category' ? (
              <CategoryTab
                categories={categories}
                shared={sharedReceipts}
              />
            ) : (
              <MonthTab
                months={months}
                year={period.year}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// 카테고리별 지출
function CategoryTab({ categories, shared }) {
  const t = analysisTexts;

  const sum = categories.reduce(
    (total, category) =>
      total + category.amount,
    0
  );

  if (
    categories.length === 0 ||
    sum <= 0
  ) {
    return (
      <View>
        <SectionHeader
          title={
            shared
              ? '카테고리별 소비'
              : t.categoryTitle
          }
          subtitle={
            shared
              ? '식비·교통비 등 소비 목적 기준'
              : t.categorySubtitle
          }
          sample={!shared}
        />

        <Text style={styles.emptyText}>
          {t.emptyText}
        </Text>
      </View>
    );
  }

  const rows = categories.map((category) => ({
    ...category,
    percent: Math.round(
      (category.amount / sum) * 100
    ),
  }));

  const top = rows.reduce(
    (a, b) =>
      b.amount > a.amount ? b : a,
    rows[0]
  );

  return (
    <View>
      <SectionHeader
        title={
          shared
            ? '카테고리별 소비'
            : t.categoryTitle
        }
        subtitle={
          shared
            ? '소비 목적별 지출 금액과 비율'
            : t.categorySubtitle
        }
        sample={!shared}
      />

      <View style={styles.donutWrap}>
        <DonutChart
          segments={rows.map((row) => ({
            value: row.amount,
            color: row.color,
          }))}
        >
          <Text style={styles.donutLabel}>
            {t.topLabel}
          </Text>

          <Text style={styles.donutName}>
            {top.name}
          </Text>

          <Text style={styles.donutPercent}>
            {top.percent}%
          </Text>
        </DonutChart>
      </View>

      <View style={styles.list}>
        {rows.map((row) => (
          <View
            key={row.id}
            style={styles.categoryRow}
          >
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: row.color,
                },
              ]}
            />

            <Text style={styles.categoryName}>
              {row.name}
            </Text>

            <Text style={styles.categoryPercent}>
              {row.percent}%
            </Text>

            <Text style={styles.categoryAmount}>
              {formatNumber(row.amount)}원
            </Text>
          </View>
        ))}
      </View>

      {shared &&
      rows.some(
        (row) =>
          row.name === '미분류(이전 기록)'
      ) ? (
        <Text style={styles.helperText}>
          이전 소비 기록 중 카테고리가
          없는 항목은 미분류로 표시했어요.
        </Text>
      ) : null}
    </View>
  );
}

// 월별 지출 비교
function MonthTab({ months, year }) {
  const t = analysisTexts;

  const rows = months.map((item, index) => ({
    ...item,
    diff:
      index === 0
        ? null
        : item.amount - months[index - 1].amount,
  }));

  const current = rows[rows.length - 1];
  const prev = rows[rows.length - 2];

  if (!current) {
    return (
      <Text style={styles.emptyText}>
        {t.emptyText}
      </Text>
    );
  }

  let title = '지난달과 같아요';
  let subtitle = '';

  if (prev && current.diff !== 0) {
    const less = current.diff < 0;

    const percent =
      prev.amount > 0
        ? Math.round(
            (
              Math.abs(current.diff) /
              prev.amount
            ) * 100
          )
        : null;

    title = `지난달보다 ${
      percent === null ? '' : `${percent}% `
    }${less ? '줄었어요' : '늘었어요'}`;

    subtitle = `${
      prev.year
    }년 ${prev.month}월보다 ${
      formatNumber(Math.abs(current.diff))
    }원 ${less ? '덜' : '더'} 썼어요.`;
  }

  return (
    <View>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        sample={false}
      />

      <Text style={styles.unit}>
        {t.chartUnit}
      </Text>

      <MonthlyBarChart data={months} />

      <View style={styles.tableHeader}>
        <Text
          style={[
            styles.headerText,
            styles.colMonth,
          ]}
        >
          기간
        </Text>

        <Text
          style={[
            styles.headerText,
            styles.colAmount,
          ]}
        >
          {t.tableSpentLabel}
        </Text>

        <Text
          style={[
            styles.headerText,
            styles.colDiff,
          ]}
        >
          {t.tableDiffLabel}
        </Text>
      </View>

      {rows.map((row, index) => {
        const isCurrent =
          index === rows.length - 1;

        return (
          <View
            key={row.key || `${year}-${row.month}`}
            style={[
              styles.tableRow,
              isCurrent && styles.currentRow,
            ]}
          >
            <Text
              style={[
                styles.cellMonth,
                styles.colMonth,
                isCurrent && styles.currentText,
              ]}
            >
              {row.year
                ? `${row.year}년 ${row.month}월`
                : `${row.month}월`}
            </Text>

            <Text
              style={[
                styles.cellAmount,
                styles.colAmount,
              ]}
            >
              {formatNumber(row.amount)}원
            </Text>

            <Text
              style={[
                styles.cellDiff,
                styles.colDiff,
                isCurrent && styles.currentText,
              ]}
            >
              {formatDiff(row.diff)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// 공통 제목 컴포넌트
function SectionHeader({
  title,
  subtitle,
  sample = false,
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTexts}>
        <Text style={styles.sectionTitle}>
          {title}
        </Text>

        {subtitle ? (
          <Text style={styles.sectionSubtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {sample ? (
        <View style={styles.sampleBadge}>
          <Text style={styles.sampleBadgeText}>
            {analysisTexts.sampleBadge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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

  errorText: {
    marginTop: 22,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.warnText,
    lineHeight: 22,
  },

  helperText: {
    marginTop: 14,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  emptyText: {
    marginTop: 32,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
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
    minHeight: 46,
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
    marginLeft: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textPrimary,
  },

  categoryPercent: {
    width: 48,
    textAlign: 'right',
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },

  categoryAmount: {
    width: 105,
    textAlign: 'right',
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.textPrimary,
  },

  unit: {
    marginTop: 18,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },

  colMonth: {
    flex: 1,
  },

  colAmount: {
    width: 100,
    textAlign: 'right',
  },

  colDiff: {
    width: 105,
    textAlign: 'right',
  },

  tableHeader: {
    marginTop: 22,
    paddingHorizontal: 5,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },

  tableRow: {
    minHeight: 48,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },

  currentRow: {
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: colors.heroBg,
  },

  cellMonth: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textPrimary,
  },

  cellAmount: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textPrimary,
  },

  cellDiff: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },

  currentText: {
    fontFamily: fonts.bold,
    color: colors.green,
  },
});
