import React, { useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import BudgetCard from '../components/BudgetCard';
import SoftButton from '../components/SoftButton';
import TransactionRow from '../components/TransactionRow';
import Fab from '../components/Fab';
import AddSpendingSheet from '../components/AddSpendingSheet';
import { TAB_BAR_HEIGHT } from '../components/TabBar';
import { spendingData } from '../data/spending/spending';
import { useAppData } from '../store/AppDataContext';
import { formatMonthDay, compareDateDesc, pad } from '../utils/format';
import { colors, fonts, spacing } from '../theme';

// 최근 지출 내역에 보여줄 최대 개수 (나머지는 "전체보기"에서 봅니다)
const RECENT_LIMIT = 10;

export default function SpendingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { budget, addOptions } = spendingData;
  const { transactions } = useAppData();
  // 처음에는 오늘이 속한 달을 보여줍니다.
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [addVisible, setAddVisible] = useState(false);

  // "소비 추가" 시트에서 항목을 고르면 시트를 먼저 닫고, 닫히는 애니메이션이 끝난 뒤(handleSheetClosed) 화면을 이동합니다.
  const pendingOption = useRef(null);

  const handleSelectAddOption = (id) => {
    pendingOption.current = id;
    setAddVisible(false);
  };

  const handleSheetClosed = () => {
    const id = pendingOption.current;
    pendingOption.current = null;
    if (id === 'manual') {
      navigation.navigate('ManualEntry');
    }
    if (id === 'gallery') {
      // TODO: 앨범에서 사진을 고르는 기능(expo-image-picker 등)을 붙이고, 인식 결과를 navigate('ReceiptResult', { receipt }) 로 넘기세요.
      // 지금은 샘플 결과 화면을 바로 보여줍니다.
      navigation.navigate('ReceiptResult');
    }
    if (id === 'receipt') {
      // TODO: 카메라 화면이 완성되면 'ReceiptCamera' 로 이동하고, 인식 결과를 navigate('ReceiptResult', { receipt }) 로 넘기세요.
      // (형식: src/data/spending/receipt.js) 지금은 카메라가 없어서 샘플 결과 화면을 바로 보여줍니다.
      navigation.navigate('ReceiptResult');
    }
  };

  // 선택한 달의 지출 내역 (날짜 최신순)과 그 달의 지출 합계
  const monthKey = `${period.year}-${pad(period.month)}`;
  const { monthTransactions, spent } = useMemo(() => {
    const list = transactions
      .filter((t) => t.date.startsWith(monthKey))
      .sort(compareDateDesc); // 같은 날짜면 나중에 추가한 것이 위
    return { monthTransactions: list, spent: list.reduce((sum, t) => sum + t.amount, 0) };
  }, [transactions, monthKey]);

  // 월 이동
  const moveMonth = (delta) => {
    setPeriod(({ year, month }) => {
      const index = year * 12 + (month - 1) + delta;
      return { year: Math.floor(index / 12), month: (index % 12) + 1 };
    });
  };

  const monthSelector = (
    <View style={styles.monthSelector}>
      <Pressable onPress={() => moveMonth(-1)} hitSlop={12} accessibilityLabel="이전 달">
        <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
      </Pressable>
      <Text style={styles.monthText}>
        {period.year}년 {period.month}월
      </Text>
      <Pressable onPress={() => moveMonth(1)} hitSlop={12} accessibilityLabel="다음 달">
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 120,
          paddingHorizontal: spacing.screenX,
        }}
      >
        <ScreenHeader title="소비" right={monthSelector} />

        <BudgetCard budget={budget} spent={spent} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>최근 지출 내역</Text>
          <Pressable
            style={styles.viewAll}
            hitSlop={8}
            accessibilityRole="button"
            onPress={() => navigation.navigate('SpendingAll')}
          >
            <Text style={styles.viewAllText}>전체보기</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>

        <SoftButton
          label="소비 분석 보기"
          icon="camera-outline"
          onPress={() => navigation.navigate('SpendingAnalysis')}
        />

        <View style={styles.list}>
          {monthTransactions.length === 0 ? (
            <Text style={styles.empty}>이 달에는 지출 내역이 없어요.</Text>
          ) : (
            monthTransactions
              .slice(0, RECENT_LIMIT)
              .map((t) => (
                <TransactionRow
                  key={t.id}
                  {...t}
                  date={formatMonthDay(t.date)}
                  onPress={() => navigation.navigate('SpendingDetail', { id: t.id })}
                />
              ))
          )}
        </View>
      </ScrollView>

      <Fab accessibilityLabel="지출 추가" onPress={() => setAddVisible(true)} />

      <AddSpendingSheet
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onClosed={handleSheetClosed}
        options={addOptions}
        onSelect={handleSelectAddOption}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthText: {
    marginHorizontal: 14,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  sectionHeader: {
    marginTop: 22,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  list: {
    marginTop: 10,
  },
  empty: {
    paddingVertical: 32,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
});
