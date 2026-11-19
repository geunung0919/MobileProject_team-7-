
import React, { useMemo, useState } from 'react';

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ScreenHeader from '../components/ScreenHeader';
import SoftButton from '../components/SoftButton';
import Chip from '../components/Chip';
import FridgeItemRow from '../components/FridgeItemRow';
import Fab from '../components/Fab';

import { TAB_BAR_HEIGHT } from '../components/TabBar';
import { fridgeData } from '../data/fridge/fridge';
import { useAppData } from '../store/AppDataContext';

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

  const {
    fridgeItems: items,
    sharedReceipts,
    sharedUid,
    visibleShared,
    refreshShared,
  } = useAppData();

  const now = new Date();
  const baseDate = toDateString(now);

  const [filter, setFilter] = useState('all');

  // 기존 로컬 식재료 정렬
  const enriched = useMemo(
    () =>
      items
        .map((item) => {
          const expiry =
            item.expiry ??
            addDays(baseDate, item.daysFromToday);

          const daysLeft = daysBetween(
            baseDate,
            expiry
          );

          return {
            ...item,
            expiry,
            daysLeft,
            urgent:
              daysLeft <= urgentWithinDays,
          };
        })
        .sort(
          (a, b) => a.daysLeft - b.daysLeft
        ),
    [items, baseDate, urgentWithinDays]
  );

  const urgentCount = enriched.filter(
    (item) => item.urgent
  ).length;

  const visible =
    filter === 'urgent'
      ? enriched.filter((item) => item.urgent)
      : enriched;

  // Firebase 재고
  const serverItems =
    sharedReceipts &&
    visibleShared?.uid === sharedUid
      ? visibleShared.inventory ?? []
      : [];

  const serverError =
    visibleShared?.inventoryError;

  const serverTruncated =
    visibleShared?.inventoryTruncated;

  const handleRefresh = async () => {
    if (!sharedUid) {
      navigation.navigate('SharedLogin');
      return;
    }

    try {
      await refreshShared(sharedUid);
    } catch (error) {
      console.error(
        '[Fridge] 목록 새로고침 실패:',
        error?.message
      );
    }
  };

  const openDetail = (id) => {
    navigation.navigate('FridgeAdd', { id });
  };

  const openUse = (id) => {
    navigation.navigate('FridgeUse', { id });
  };

  // Firebase 식재료 폐기
  const openDiscard = (id) => {
    navigation.navigate(
      'FridgeCloudDiscard',
      { id }
    );
  };

  const openAdd = () => {
    if (sharedReceipts && !sharedUid) {
      navigation.navigate('SharedLogin');
      return;
    }

    navigation.navigate('FridgeAdd');
  };

  // 신규 기능: 소비기한 알림 화면 이동
  const openExpiryAlert = () => {
    navigation.navigate('FridgeExpiryAlert');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingBottom:
            TAB_BAR_HEIGHT + insets.bottom + 120,
          paddingHorizontal: spacing.screenX,
        }}
      >
        <ScreenHeader
          title="냉장고"
          rightText={formatKoreanDate(now)}
          subtitle="우리 집 식재료, 기한 전에 챙겨요."
        />

        <View style={{ gap: 14 }}>
        <SoftButton
          label="AI 레시피 추천"
          icon="fridge-outline"
          onPress={() =>
            navigation.navigate('RecipeList')
          }
        />

        <SoftButton
          label="장보기 목록"
          icon="cart-outline"
          onPress={() =>
            navigation.navigate('FridgeShopping')
          }
        />

        <SoftButton
          label="식사 기록"
          icon="silverware-fork-knife"
          onPress={() =>
            navigation.navigate('FridgeMeal')
          }
        />

        {/* 신규: 소비기한 알림 버튼 */}
        <SoftButton
          label="소비기한 알림 확인하기"
          icon="bell-outline"
          onPress={openExpiryAlert}
        />

        </View>

        {sharedReceipts ? (
          <View style={styles.serverSection}>
            <Text style={styles.sectionTitle}>
              서버에 등록한 식재료
            </Text>

            <SoftButton
              label={
                sharedUid
                  ? '서버 목록 새로고침'
                  : '로그인'
              }
              onPress={handleRefresh}
            />

            {!!serverError && (
              <Text
                style={styles.errorText}
                accessibilityRole="alert"
              >
                {serverError}
              </Text>
            )}

            {!!serverTruncated && (
              <Text style={styles.warningText}>
                서버 목록 일부만 조회됐어요.
                전체 재고 확인이 필요합니다.
              </Text>
            )}

            {!sharedUid && (
              <Text style={styles.emptyText}>
                냉장고 데이터를 확인하려면
                로그인해 주세요.
              </Text>
            )}

            {sharedUid &&
              visibleShared &&
              serverItems.length === 0 &&
              !serverError && (
                <Text style={styles.emptyText}>
                  등록된 식재료가 없어요.
                  아래 추가 버튼을 눌러 주세요.
                </Text>
              )}

            {serverItems.map((row) => {
              const quantityLabel =
                `${row.quantity ?? 0}${row.unit ?? ''}`;

              const expiryLabel =
                row.expiresAt || '기한 미입력';

              return (
                <View
                  key={row.id}
                  style={styles.serverItem}
                >
                  <SoftButton
                    label={
                      `${row.name} · ${quantityLabel} · ${expiryLabel}`
                    }
                    onPress={() =>
                      openDetail(row.id)
                    }
                  />

                  <View style={styles.actionRow}>
                    <View style={styles.actionColumn}>
                      <SoftButton
                        label="사용량 차감"
                        onPress={() =>
                          openUse(row.id)
                        }
                      />
                    </View>

                    <View style={styles.actionColumn}>
                      <SoftButton
                        label="폐기"
                        onPress={() =>
                          openDiscard(row.id)
                        }
                      />
                    </View>
                  </View>

                  <Text style={styles.itemHint}>
                    식재료 정보를 누르면 수정할 수 있어요.
                    사용하거나 폐기한 수량은
                    냉장고 재고에 반영됩니다.
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              보관 중인 식재료
            </Text>

            <View style={styles.chipRow}>
              <Chip
                label="전체"
                count={enriched.length}
                selected={filter === 'all'}
                onPress={() =>
                  setFilter('all')
                }
              />

              <Chip
                label="유통기한 임박"
                count={urgentCount}
                selected={filter === 'urgent'}
                onPress={() =>
                  setFilter('urgent')
                }
              />
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                임박은 {urgentWithinDays}일 이내 · 유통기한 빠른 순
              </Text>

              <Text style={styles.metaText}>
                {formatDotDate(baseDate)} 기준
              </Text>
            </View>

            <View>
              {visible.map((item, index) => (
                <FridgeItemRow
                  key={item.id}
                  {...item}
                  isLast={
                    index === visible.length - 1
                  }
                  onPress={() =>
                    openDetail(item.id)
                  }
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Fab
        accessibilityLabel="식재료 추가"
        onPress={openAdd}
      />
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
    marginBottom: 16,
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
  },

  serverSection: {
    gap: 8,
    marginVertical: 16,
  },

  serverItem: {
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },

  actionColumn: {
    flex: 1,
  },

  itemHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    color: colors.textSecondary,
    marginTop: 4,
  },

  errorText: {
    fontFamily: fonts.regular,
    color: colors.warnText,
    fontSize: 14,
    marginVertical: 10,
  },

  warningText: {
    fontFamily: fonts.regular,
    color: colors.warnText,
    fontSize: 14,
    marginVertical: 10,
  },

  emptyText: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginVertical: 14,
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
