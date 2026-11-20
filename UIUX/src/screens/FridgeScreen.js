import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import SoftButton from '../components/SoftButton';
import RefreshButton from '../components/RefreshButton';
import Chip from '../components/Chip';
import FridgeItemRow from '../components/FridgeItemRow';
import Fab from '../components/Fab';
import { TAB_BAR_HEIGHT } from '../components/TabBar';
import { fridgeData } from '../data/fridge/fridge';
import { useAppData } from '../store/AppDataContext';
import { changeFridgeItem } from '../../../api/receiptApi';
import { confirmAction } from '../utils/confirm';
import {
  daysBetween,
  formatDotDate,
  toDateString,
  addDays,
  formatKoreanDate,
} from '../utils/format';
import { colors, fonts, spacing } from '../theme';

export default function FridgeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { urgentWithinDays } = fridgeData;
  const { fridgeItems: items, sharedReceipts, sharedUid, visibleShared, refreshShared } = useAppData();
  const now = new Date();
  const baseDate = toDateString(now); // 기준일 = 오늘
  const [filter, setFilter] = useState('all'); // 'all' | 'urgent' | 'expired'

  // 서버에 등록한 식재료 삭제 (잘못 등록한 것 지우기). 이미 없거나 다른 곳에서 바뀐 경우에도 목록만 새로 고칩니다.
  const deleteServerItem = (row) => confirmAction({
    title: '식재료를 삭제할까요?',
    message: `'${row.name}'이(가) 냉장고에서 삭제돼요.`,
    confirmLabel: '삭제',
    destructive: true,
    onConfirm: async () => {
      try {
        await changeFridgeItem({ action: 'delete', id: row.id, version: row.version }, sharedUid);
      } catch {
        /* 404/409: 아래 새로고침으로 최신 목록을 보여 줍니다 */
      }
      await refreshShared(sharedUid).catch(() => {});
    },
  });

  // 유통기한 빠른 순으로 정렬하고, 남은 일수/임박 여부를 계산합니다.
  const enriched = useMemo(
    () =>
      items
        .map((item) => {
          const expiry = item.expiry ?? addDays(baseDate, item.daysFromToday);
          const daysLeft = daysBetween(baseDate, expiry);
          return { ...item, expiry, daysLeft, urgent: daysLeft <= urgentWithinDays };
        })
        .sort((a, b) => a.daysLeft - b.daysLeft),
    [items, baseDate, urgentWithinDays]
  );

  const urgentCount = enriched.filter((i) => i.urgent).length;
  const expiredCount = enriched.filter((i) => i.daysLeft < 0).length;
  const visible =
    filter === 'urgent'
      ? enriched.filter((i) => i.urgent)
      : filter === 'expired'
        ? enriched.filter((i) => i.daysLeft < 0)
        : enriched;

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
        <ScreenHeader
          title="냉장고"
          rightText={formatKoreanDate(now)}
          subtitle="우리 집 식재료, 기한 전에 챙겨요."
        />

        <SoftButton
          label="AI 레시피 추천"
          icon="fridge-outline"
          onPress={() => navigation.navigate('RecipeList')}
        />

        {sharedReceipts ? <View style={{ gap: 8, marginVertical: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.sectionTitle}>서버에 등록한 식재료</Text>
            {sharedUid ? <RefreshButton style={{ alignSelf: 'center' }} onPress={() => refreshShared(sharedUid).catch(() => {})} /> : null}
          </View>
          {sharedUid ? null : <SoftButton label="로그인" onPress={() => navigation.navigate('SharedLogin')} />}
          {visibleShared?.inventoryError ? <Text accessibilityRole="alert">{visibleShared.inventoryError}</Text> : null}
          {visibleShared?.inventoryTruncated ? <Text>서버 식재료 목록 일부만 표시돼요.</Text> : null}
          {visibleShared?.inventory?.map((row) => <View key={row.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ flex: 1 }}>
              <SoftButton label={`${row.name} · ${row.quantity}${row.unit} · ${row.expiresAt || '기한 미입력'}`}
                onPress={() => navigation.navigate('FridgeAdd', { id: row.id })} />
            </View>
            <Pressable onPress={() => deleteServerItem(row)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${row.name} 삭제`}
              style={{ padding: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.checkboxBorder, backgroundColor: colors.white }}>
              <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>)}
        </View> : null}
        {!sharedReceipts ? <>
        <Text style={styles.sectionTitle}>보관 중인 식재료</Text>

        <View style={styles.chipRow}>
          <Chip
            label="전체"
            count={enriched.length}
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <Chip
            label="유통기한 임박"
            count={urgentCount}
            selected={filter === 'urgent'}
            onPress={() => setFilter('urgent')}
          />
          <Chip
            label="폐기"
            count={expiredCount}
            selected={filter === 'expired'}
            onPress={() => setFilter('expired')}
          />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>임박은 {urgentWithinDays}일 이내 · 유통기한 빠른 순</Text>
          <Text style={styles.metaText}>{formatDotDate(baseDate)} 기준</Text>
        </View>

        <View>
          {visible.map((item, i) => (
            <FridgeItemRow
              key={item.id}
              {...item}
              isLast={i === visible.length - 1}
              onPress={() =>
                // 유통기한이 지난 품목은 수정 화면 대신 폐기 화면으로 갑니다.
                item.daysLeft < 0
                  ? navigation.navigate('FridgeDiscard', { id: item.id })
                  : navigation.navigate('FridgeAdd', { id: item.id })
              }
            />
          ))}
        </View>
        </> : null}
      </ScrollView>

      <Fab accessibilityLabel="식재료 추가" onPress={() => navigation.navigate(sharedReceipts && !sharedUid ? 'SharedLogin' : 'FridgeAdd')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    marginTop: 32,
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  chipRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  metaRow: {
    marginTop: 14,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
});
