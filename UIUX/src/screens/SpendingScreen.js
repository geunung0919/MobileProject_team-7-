import React, { useMemo, useRef, useState } from 'react';
import { View, ScrollView, Pressable, Modal, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import Text from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import BudgetCard from '../components/BudgetCard';
import SoftButton from '../components/SoftButton';
import TransactionRow from '../components/TransactionRow';
import Fab from '../components/Fab';
import AddSpendingSheet from '../components/AddSpendingSheet';
import BudgetSheet from '../components/BudgetSheet';
import { TAB_BAR_HEIGHT } from '../components/TabBar';
import { spendingData } from '../data/spending/spending';
import { useAppData } from '../store/AppDataContext';
import { api } from '../lib/api';
import { pickReceiptPhoto, analyzeReceiptPhoto } from '../lib/receiptOcr';
import { receiptFromAnalysis } from '../lib/serverData';
import { formatMonthDay, compareDateDesc, pad } from '../utils/format';
import { colors, fonts, spacing } from '../theme';

// 최근 지출 내역에 보여줄 최대 개수 (나머지는 "전체보기"에서 봅니다)
const RECENT_LIMIT = 10;

export default function SpendingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { addOptions } = spendingData;
  const { transactions, budget, budgetIsSet, setBudget, isServer, syncState, syncError, refresh } = useAppData();
  const [budgetVisible, setBudgetVisible] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
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
    if (id === 'gallery' || id === 'receipt') {
      scanReceipt(id === 'receipt' ? 'camera' : 'gallery');
    }
  };

  // 영수증 촬영/앨범 선택 -> 서버 OCR -> 인식 결과 화면. 서버 연결이 없으면 샘플 결과를 보여줍니다.
  const scanReceipt = async (mode) => {
    if (!api) {
      navigation.navigate('ReceiptResult');
      return;
    }
    try {
      const asset = await pickReceiptPhoto(mode);
      if (!asset) return; // 취소
      setAnalyzing(true);
      const result = await analyzeReceiptPhoto(api, asset);
      navigation.navigate('ReceiptResult', { receipt: receiptFromAnalysis(result) });
    } catch (error) {
      Alert.alert('영수증을 읽지 못했어요', error?.message ?? '다시 촬영해 주세요.');
    } finally {
      setAnalyzing(false);
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

        {isServer && syncState === 'error' ? (
          <Pressable onPress={refresh} style={styles.syncError} accessibilityRole="button">
            <Text style={styles.syncErrorText}>{syncError}</Text>
            <Text style={styles.syncRetry}>다시 불러오기</Text>
          </Pressable>
        ) : null}

        <Pressable onPress={() => setBudgetVisible(true)} accessibilityRole="button" accessibilityLabel="이번 달 예산 수정">
          <BudgetCard budget={budget} spent={spent} />
        </Pressable>
        {!budgetIsSet ? <Text style={styles.budgetHint}>예산 카드를 눌러 이번 달 예산을 정해 주세요.</Text> : null}

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
          icon="chart-donut"
          onPress={() => navigation.navigate('SpendingAnalysis', { year: period.year, month: period.month })}
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

      <BudgetSheet
        visible={budgetVisible}
        budget={budgetIsSet ? budget : null}
        onClose={() => setBudgetVisible(false)}
        onSubmit={setBudget}
      />

      <Modal visible={analyzing} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <ActivityIndicator size="large" color={colors.green} />
            <Text style={styles.overlayText}>영수증을 읽고 있어요</Text>
            <Text style={styles.overlaySub}>10~30초 정도 걸려요</Text>
          </View>
        </View>
      </Modal>
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
  budgetHint: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  syncError: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.cardBg,
  },
  syncErrorText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textPrimary,
  },
  syncRetry: {
    marginTop: 6,
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.green,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  overlayBox: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 28,
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  overlayText: {
    marginTop: 14,
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  overlaySub: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  empty: {
    paddingVertical: 32,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
});