import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import TransactionRow from '../components/TransactionRow';
import { spendingAllTexts as t } from '../data/spending/spendingAll';
import { useAppData } from '../store/AppDataContext';
import { formatNumber, formatMonthDay, compareDateDesc } from '../utils/format';
import { colors, fonts, spacing } from '../theme';

// "2026-10" -> "2026년 10월"
const formatMonthLabel = (monthKey) => {
  const [y, m] = monthKey.split('-').map(Number);
  return `${y}년 ${m}월`;
};

// 소비 > 전체보기. 모든 지출을 달별로 묶어 최신순으로 보여 주고, 누르면 지출 상세로 이동합니다.
export default function SpendingAllScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { transactions } = useAppData();

  const { groups, total } = useMemo(() => {
    // 날짜 최신순 (같은 날짜면 나중에 추가한 것이 위 - 소비 화면과 같은 규칙)
    const sorted = [...transactions].sort(compareDateDesc);
    const byMonth = new Map();
    sorted.forEach((tx) => {
      const key = tx.date.slice(0, 7);
      if (!byMonth.has(key)) byMonth.set(key, { key, list: [], sum: 0 });
      const group = byMonth.get(key);
      group.list.push(tx);
      group.sum += tx.amount;
    });
    return {
      groups: [...byMonth.values()],
      total: sorted.reduce((sum, tx) => sum + tx.amount, 0),
    };
  }, [transactions]);

  const subtitle =
    transactions.length > 0
      ? `총 ${transactions.length}${t.countUnit} · ${t.sumLabel} ${formatNumber(total)}원`
      : undefined;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: spacing.screenX,
        }}
      >
        <BackHeader title={t.title} subtitle={subtitle} onBack={() => navigation.goBack()} />

        {groups.length === 0 ? (
          <Text style={styles.empty}>{t.emptyText}</Text>
        ) : (
          groups.map((group, index) => (
            <View key={group.key}>
              <View style={[styles.monthHeader, index > 0 && styles.monthHeaderNext]}>
                <Text style={styles.monthLabel}>{formatMonthLabel(group.key)}</Text>
                <Text style={styles.monthSum}>{formatNumber(group.sum)}원</Text>
              </View>
              {group.list.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  {...tx}
                  date={formatMonthDay(tx.date)}
                  onPress={() => navigation.navigate('SpendingDetail', { id: tx.id })}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  monthHeader: {
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthHeaderNext: {
    marginTop: 22,
  },
  monthLabel: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  monthSum: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  empty: {
    marginTop: 40,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
});
