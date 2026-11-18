import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { loadBudget, listRoutines } from '../../../api/receiptApi';
import { sharedFridgeEntries } from '../utils/recipes';
import HeroCard from '../components/HeroCard';
import SummaryCard, { summaryStyles } from '../components/SummaryCard';
import TaskRow from '../components/TaskRow';
import { TAB_BAR_HEIGHT } from '../components/TabBar';
import ScreenHeader from '../components/ScreenHeader';
import { homeData } from '../data/home/home';
import { spendingData } from '../data/spending/spending';
import { fridgeData } from '../data/fridge/fridge';
import { useAppData } from '../store/AppDataContext';
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
  const { transactions, fridgeItems, todos, routines, sharedReceipts, sharedUid, visibleShared } = useAppData();

  // 홈의 숫자는 저장소 데이터로 계산합니다 (다른 탭에서 바꾸면 홈에 바로 반영).
  const now = new Date();
  const baseDate = toDateString(now);
  const focused = useIsFocused();
  const month = baseDate.slice(0, 7);
  const [cloudBudget, setCloudBudget] = useState(null);
  const [cloudRoutine, setCloudRoutine] = useState(null);
  const budgetKey = sharedUid ? `${sharedUid}:${month}` : null;
  const budget = cloudBudget?.key === budgetKey ? cloudBudget?.value : null;
  const routineRows = cloudRoutine?.uid === sharedUid ? cloudRoutine?.value : null;
  useEffect(() => {
    if (!focused || !sharedUid) return;
    let active = true;
    loadBudget(month, sharedUid).then((value) => { if (active) setCloudBudget({ key: budgetKey, value }); })
      .catch(() => { if (active) setCloudBudget({ key: budgetKey, value: null }); });
    return () => { active = false; };
  }, [focused, sharedUid, month, budgetKey, visibleShared?.spending]);
  useEffect(() => {
    if (!focused || !sharedUid) return;
    let active = true;
    const refresh = () => listRoutines(sharedUid).then((value) => { if (active) setCloudRoutine({ uid: sharedUid, value }); })
      .catch(() => { if (active) setCloudRoutine({ uid: sharedUid, value: null }); });
    refresh();
    const timer = setInterval(refresh, 60000);
    return () => { active = false; clearInterval(timer); };
  }, [focused, sharedUid]);
  const summary = useMemo(
    () => ({
      spending: sharedReceipts ? { month: now.getMonth() + 1, spent: budget?.spent, budget: budget?.budget,
        remaining: budget?.budget != null ? budget.budget - budget.spent : null } :
        getSpendingSummary(transactions, spendingData.budget, new Date()),
      fridge: getFridgeSummary(sharedReceipts ? sharedFridgeEntries(visibleShared?.inventory) : fridgeItems, baseDate, fridgeData.urgentWithinDays),
      tasks: getTaskSummaries(sharedReceipts ? (routineRows?.items ?? []).filter((row) => row.scheduledToday).map((row) => ({ ...row, time: row.time || '' })) : routines, todos, baseDate),
    }),
    [transactions, fridgeItems, todos, routines, baseDate, sharedReceipts, visibleShared?.inventory, budget, routineRows]
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
          description={`${sharedReceipts && !visibleShared?.inventory ? (sharedUid ? '냉장고 데이터를 확인해 주세요.' : '로그인하면 내 생활 데이터가 표시돼요.') : getHeroLine(first)}\n${hero.closing}`}
        />

        {/* 소비 / 냉장고 요약 */}
        <View style={styles.cardRow}>
          <SummaryCard title={spending.title} onPress={() => navigation.navigate('Spending')}>
            <Text style={summaryStyles.label}>{spendingSummary.month}월 남은 예산</Text>
            <View style={summaryStyles.bigRow}>
              <Text style={summaryStyles.bigText}>{spendingSummary.remaining == null ? '—' : formatNumber(spendingSummary.remaining)}</Text>
              <Text style={summaryStyles.unit}>원</Text>
            </View>
            <View style={styles.spendingSub}>
              <Text style={summaryStyles.sub}>지출 {spendingSummary.spent == null ? '—' : `${formatNumber(spendingSummary.spent)}원`}</Text>
              <Text style={summaryStyles.sub}>예산 {spendingSummary.budget == null ? '—' : `${formatNumber(spendingSummary.budget)}원`}</Text>
            </View>
          </SummaryCard>

          <SummaryCard title={fridge.title} onPress={() => navigation.navigate('Fridge')}>
            <Text style={summaryStyles.label}>보관 중인 식재료 {sharedReceipts && !visibleShared?.inventory ? '—' : `${fridgeSummary.total}개`}</Text>
            {/* 좁은 화면(아이폰·소형 안드로이드)에서 "기한 임 / 박" 처럼 줄바꿈되지 않게 제목은 작게, 개수는 크게 한 줄로 */}
            <View style={summaryStyles.bigRow}>
              <Text style={styles.fridgeHeadline} numberOfLines={1}>{fridge.headline}</Text>
              <Text style={[summaryStyles.bigText, styles.greenText]} numberOfLines={1}>{sharedReceipts && !visibleShared?.inventory ? '—' : `${fridgeSummary.urgentCount}개`}</Text>
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
              status={sharedReceipts && task.id === 'routine' && !routineRows ? '—' : summary.tasks[task.id].status}
              summary={sharedReceipts && task.id === 'routine' && !routineRows ? (sharedUid ? '서버 루틴을 확인해 주세요.' : '로그인하면 루틴을 불러와요.') : summary.tasks[task.id].summary}
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
  fridgeHeadline: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.textPrimary,
    marginRight: 4,
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
    backgroundColor: colors.divider,
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
