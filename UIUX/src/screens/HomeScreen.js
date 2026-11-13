import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Text from '../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeroCard from '../components/HeroCard';
import SummaryCard, { summaryStyles } from '../components/SummaryCard';
import TaskRow from '../components/TaskRow';
import { TAB_BAR_HEIGHT } from '../components/TabBar';
import ScreenHeader from '../components/ScreenHeader';
import { homeData } from '../data/home/home';
import { spendingData } from '../data/spending/spending';
import { fridgeData } from '../data/fridge/fridge';
import { useAppData } from '../store/AppDataContext';
import { useTodayReport } from '../hooks/useAi';
import {
  getSpendingSummary,
  getFridgeSummary,
  getHeroLine,
  getTaskSummaries,
} from '../utils/homeSummary';
import { formatNumber, formatKoreanDate, toDateString } from '../utils/format';
import { colors, fonts, spacing } from '../theme';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { hero, spending, fridge, tasks } = homeData;
  const { transactions, fridgeItems, todos, routines } = useAppData();
  // AI 리포트: 서버가 설정돼 있으면 오늘의 한마디를 AI 문장으로 (없거나 실패하면 아래 기존 문장)
  const { report: aiReport } = useTodayReport();

  // 홈의 숫자는 저장소 데이터로 계산합니다 (다른 탭에서 바꾸면 홈에 바로 반영).
  const now = new Date();
  const baseDate = toDateString(now);
  const summary = useMemo(
    () => ({
      spending: getSpendingSummary(transactions, spendingData.budget, new Date()),
      fridge: getFridgeSummary(fridgeItems, baseDate, fridgeData.urgentWithinDays),
      tasks: getTaskSummaries(routines, todos, baseDate),
    }),
    [transactions, fridgeItems, todos, routines, baseDate]
  );
  const { fridge: fridgeSummary, spending: spendingSummary } = summary;
  const first = fridgeSummary.first;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 40,
          paddingHorizontal: spacing.screenX,
        }}
      >
        <ScreenHeader title="홈" rightText={formatKoreanDate(now)} />

        {/* 오늘의 한마디: 첫 줄은 가장 먼저 상하는 식재료로 자동 생성 */}
        <HeroCard
          label={hero.label}
          badge={hero.badge}
          title={hero.title}
          description={aiReport?.today_message ?? `${getHeroLine(first)}\n${hero.closing}`}
        />

        {/* 소비 / 냉장고 요약 */}
        <View style={styles.cardRow}>
          <SummaryCard title={spending.title} onPress={() => navigation.navigate('Spending')}>
            <Text style={summaryStyles.label}>{spendingSummary.month}월 남은 예산</Text>
            <View style={summaryStyles.bigRow}>
              <Text style={summaryStyles.bigText}>{formatNumber(spendingSummary.remaining)}</Text>
              <Text style={summaryStyles.unit}>원</Text>
            </View>
            <View style={styles.spendingSub}>
              <Text style={summaryStyles.sub}>지출 {formatNumber(spendingSummary.spent)}원</Text>
              <Text style={summaryStyles.sub}>예산 {formatNumber(spendingSummary.budget)}원</Text>
            </View>
          </SummaryCard>

          <SummaryCard title={fridge.title} onPress={() => navigation.navigate('Fridge')}>
            <Text style={summaryStyles.label}>보관 중인 식재료 {fridgeSummary.total}개</Text>
            <View style={summaryStyles.bigRow}>
              <Text style={summaryStyles.bigText}>{fridge.headline} </Text>
              <Text style={[summaryStyles.bigText, styles.greenText]}>{fridgeSummary.urgentCount}개</Text>
            </View>
            <View style={styles.fridgeSub}>
              {first ? (
                <>
                  <Text style={[summaryStyles.sub, styles.fridgeName]} numberOfLines={1}>
                    {first.label}
                  </Text>
                  <View style={[styles.tag, first.urgent ? styles.warnTag : styles.calmTag]}>
                    <Text style={[styles.tagText, first.urgent ? styles.warnTagText : styles.calmTagText]}>
                      {first.tag}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={summaryStyles.sub}>{fridge.emptyText}</Text>
              )}
            </View>
          </SummaryCard>
        </View>

        {/* 오늘 챙길 일 */}
        <Text style={styles.sectionTitle}>오늘 챙길 일</Text>
        <View>
          {tasks.map((task, i) => (
            <TaskRow
              key={task.id}
              title={task.title}
              status={summary.tasks[task.id].status}
              summary={summary.tasks[task.id].summary}
              isLast={i === tasks.length - 1}
              onPress={() => navigation.navigate(task.route)}
            />
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
  cardRow: {
    flexDirection: 'row',
    gap: spacing.gap,
    marginTop: 20,
  },
  spendingSub: {
    marginTop: 8,
  },
  fridgeSub: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greenText: {
    color: colors.green,
  },
  fridgeName: {
    flex: 1,
    marginRight: 6,
  },
  tag: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  tagText: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  // 임박한 식재료: 주황색 / 아직 여유 있는 식재료: 회색
  warnTag: {
    backgroundColor: colors.warnBg,
  },
  warnTagText: {
    color: colors.warnText,
  },
  calmTag: {
    backgroundColor: colors.calmBg,
  },
  calmTagText: {
    color: colors.textSecondary,
  },
  sectionTitle: {
    marginTop: 32,
    marginBottom: 6,
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
  },
});
